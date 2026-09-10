import { Injectable, Logger } from '@nestjs/common';
import {
  formatIsoInTimeZone,
  nowIso
} from '../../common/utils/date.util';
import type { Ingredient } from '../ingredients/models/ingredient.model';
import { IngredientsService } from '../ingredients/ingredients.service';
import type { InventoryBatch } from '../inventory-batches/models/inventory-batch.model';
import { InventoryBatchesRepository } from '../inventory-batches/repositories/inventory-batches.repository';
import type { Recipe } from '../recipes/models/recipe.model';
import { RecipesService } from '../recipes/recipes.service';
import type { Recommendation } from '../recommendations/models/recommendation.model';
import { RecommendationsRepository } from '../recommendations/repositories/recommendations.repository';
import { RestaurantsService } from '../restaurants/restaurants.service';
import type { StockMovement } from '../stock-consumptions/models/stock-movement.model';
import { StockMovementsRepository } from '../stock-consumptions/repositories/stock-movements.repository';
import type { WasteEvent } from '../waste-events/models/waste-event.model';
import { WasteEventsRepository } from '../waste-events/repositories/waste-events.repository';
import type { GetDashboardQueryDto } from './dto/get-dashboard-query.dto';
import type {
  DashboardActivitySummary,
  DashboardFinanceSummary,
  DashboardInventorySummary,
  DashboardLowStockIngredient,
  DashboardRecipeSummary,
  DashboardRecommendationSummary,
  DashboardTopWastedIngredient,
  DashboardWasteSummary,
  RestaurantDashboardSummary
} from './models/dashboard-summary.model';
import { RedisCacheService } from 'src/common/redis/redis-cache.service';

@Injectable()
export class DashboardService {

  private readonly expiringSoonDays = 3;
  private readonly maxRecentActivityItems = 10;
  private readonly maxRecipesToPromote = 5;
  private readonly maxTopWastedIngredients = 5;

  private readonly logger = new Logger(DashboardService.name);
  private readonly dashboardCacheTtlSeconds = 30;

  constructor(
    private readonly restaurantsService: RestaurantsService,
    private readonly ingredientsService: IngredientsService,
    private readonly inventoryBatchesRepository: InventoryBatchesRepository,
    private readonly recipesService: RecipesService,
    private readonly stockMovementsRepository: StockMovementsRepository,
    private readonly wasteEventsRepository: WasteEventsRepository,
    private readonly recommendationsRepository: RecommendationsRepository,
    private readonly redisCacheService: RedisCacheService

  ) { }

  async getDashboardSummary(
    restaurantId: string,
    _query: GetDashboardQueryDto
  ): Promise<RestaurantDashboardSummary> {

    const cacheKey = `dashboard:summary:${restaurantId}`;

    const cachedSummary =
      await this.redisCacheService.get<RestaurantDashboardSummary>(
        cacheKey
      );

    if (cachedSummary !== null) {
      this.logger.log(
        `Dashboard cache HIT for restaurant ${restaurantId}`
      );

      return cachedSummary;
    }

    this.logger.log(
      `Dashboard cache MISS for restaurant ${restaurantId}`
    );


    const restaurant = await this.restaurantsService.getRestaurantById(restaurantId);

    const [
      ingredients,
      inventoryBatches,
      recipes,
      stockMovements,
      wasteEvents,
      recommendations
    ] = await Promise.all([
      this.ingredientsService.listIngredients(restaurantId, {}),
      this.inventoryBatchesRepository.findInventoryBatchesByRestaurantId(restaurantId, { isActive: true }),
      this.recipesService.listRecipes(restaurantId, { status: 'ACTIVE', isActive: 'true' }),
      this.stockMovementsRepository.findStockMovementsByRestaurantId(restaurantId),
      this.wasteEventsRepository.findWasteEventsByRestaurantId(restaurantId),
      this.recommendationsRepository.findRecommendationsByRestaurantId(restaurantId)
    ]);
    const generatedAt = nowIso();

    const summary: RestaurantDashboardSummary = {
      restaurantId,
      generatedAt,
      generatedAtLocal: formatIsoInTimeZone(generatedAt, restaurant.timezone),
      timezone: restaurant.timezone,
      inventory: this.buildInventorySummary(inventoryBatches, ingredients),
      finance: this.buildFinanceSummary(stockMovements),
      waste: this.buildWasteSummary(wasteEvents),
      recommendations: this.buildRecommendationSummary(recommendations),
      recipes: this.buildRecipeSummary(recipes, inventoryBatches),
      activity: this.buildActivitySummary(stockMovements, wasteEvents)
    };

    await this.redisCacheService.set(
      cacheKey,
      summary,
      this.dashboardCacheTtlSeconds
    );

    return summary;
  }

  private buildFinanceSummary(
    stockMovements: StockMovement[]
  ): DashboardFinanceSummary {
    const recipeSalesById = new Map<string, {
      quantitySold: number;
      totalSalesRevenue: number;
      inventoryCostConsumed: number;
      estimatedGrossProfit: number;
    }>();

    stockMovements
      .filter((movement) => movement.source === 'RECIPE_SALE')
      .forEach((movement) => {
        if (!movement.saleId || movement.totalSalesRevenue === undefined) {
          return;
        }

        if (recipeSalesById.has(movement.saleId)) {
          return;
        }

        recipeSalesById.set(movement.saleId, {
          quantitySold: movement.quantitySold ?? 0,
          totalSalesRevenue: movement.totalSalesRevenue,
          inventoryCostConsumed: movement.inventoryCostConsumed ?? 0,
          estimatedGrossProfit: movement.estimatedGrossProfit ?? 0
        });
      });

    const recipeSales = Array.from(recipeSalesById.values());
    const totalSalesRevenue = recipeSales.reduce((total, sale) => {
      return total + sale.totalSalesRevenue;
    }, 0);
    const inventoryCostConsumed = recipeSales.reduce((total, sale) => {
      return total + sale.inventoryCostConsumed;
    }, 0);
    const estimatedGrossProfit = recipeSales.reduce((total, sale) => {
      return total + sale.estimatedGrossProfit;
    }, 0);
    const unitsSold = recipeSales.reduce((total, sale) => {
      return total + sale.quantitySold;
    }, 0);
    const recipeSaleCount = recipeSales.length;

    return {
      totalSalesRevenue: this.roundMoney(totalSalesRevenue),
      inventoryCostConsumed: this.roundMoney(inventoryCostConsumed),
      estimatedGrossProfit: this.roundMoney(estimatedGrossProfit),
      estimatedGrossMarginPercentage: this.calculateGrossMarginPercentage({
        estimatedGrossProfit,
        totalSalesRevenue
      }),
      recipeSaleCount,
      unitsSold,
      averageSaleValue: this.roundMoney(
        recipeSaleCount > 0 ? totalSalesRevenue / recipeSaleCount : 0
      )
    };
  }

  private buildInventorySummary(
    inventoryBatches: InventoryBatch[],
    ingredients: Ingredient[]
  ): DashboardInventorySummary {
    const now = Date.now();
    const expiringSoonMs = this.expiringSoonDays * 24 * 60 * 60 * 1000;

    const activeBatches = inventoryBatches.filter((batch) => batch.isActive);
    const availableBatches = activeBatches.filter((batch) => batch.quantityAvailable > 0);

    const totalInventoryValue = availableBatches.reduce((total, batch) => {
      return total + batch.quantityAvailable * batch.unitCost;
    }, 0);

    const expiringSoonBatchCount = availableBatches.filter((batch) => {
      const expiresAt = new Date(batch.expiresAt).getTime();

      return expiresAt >= now && expiresAt - now <= expiringSoonMs;
    }).length;

    const expiredBatchCount = availableBatches.filter((batch) => {
      return new Date(batch.expiresAt).getTime() < now;
    }).length;

    const lowStockIngredients = this.buildLowStockIngredients(availableBatches, ingredients);

    return {
      totalInventoryValue: this.roundMoney(totalInventoryValue),
      activeBatchCount: activeBatches.length,
      lowStockIngredientCount: lowStockIngredients.length,
      expiringSoonBatchCount,
      expiredBatchCount,
      lowStockIngredients
    };
  }

  private buildWasteSummary(wasteEvents: WasteEvent[]): DashboardWasteSummary {
    const totalWasteCost = wasteEvents.reduce((total, event) => {
      return total + event.totalCost;
    }, 0);

    return {
      totalWasteCost: this.roundMoney(totalWasteCost),
      wasteEventCount: wasteEvents.length,
      topWastedIngredients: this.buildTopWastedIngredients(wasteEvents)
    };
  }

  private buildRecommendationSummary(
    recommendations: Recommendation[]
  ): DashboardRecommendationSummary {
    const openRecommendations = recommendations.filter((recommendation) => {
      return recommendation.status === 'OPEN';
    });

    const highPriorityRecommendations = openRecommendations.filter((recommendation) => {
      return recommendation.priority === 'HIGH';
    });

    const recommendationsByType = Array.from(
      openRecommendations.reduce((summary, recommendation) => {
        const current = summary.get(recommendation.type) ?? 0;

        summary.set(recommendation.type, current + 1);

        return summary;
      }, new Map<string, number>())
    ).map(([type, count]) => ({ type, count }));

    return {
      openRecommendationCount: openRecommendations.length,
      highPriorityRecommendationCount: highPriorityRecommendations.length,
      recommendationsByType
    };
  }

  private buildRecipeSummary(
    recipes: Recipe[],
    inventoryBatches: InventoryBatch[]
  ): DashboardRecipeSummary {
    const highMarginRecipes = recipes.filter((recipe) => {
      return recipe.estimatedGrossMarginPercentage >= 65;
    });

    const availableIngredientIds = new Set(
      inventoryBatches
        .filter((batch) => batch.quantityAvailable > 0)
        .map((batch) => batch.ingredientId)
    );

    const recipesToPromote = recipes
      .filter((recipe) => {
        return recipe.ingredients.every((line) => availableIngredientIds.has(line.ingredientId));
      })
      .sort((a, b) => b.estimatedGrossMarginPercentage - a.estimatedGrossMarginPercentage)
      .slice(0, this.maxRecipesToPromote)
      .map((recipe) => ({
        recipeId: recipe.id,
        recipeName: recipe.name,
        estimatedGrossMarginPercentage: recipe.estimatedGrossMarginPercentage,
        menuPrice: recipe.menuPrice
      }));

    return {
      activeRecipeCount: recipes.length,
      highMarginRecipeCount: highMarginRecipes.length,
      recipesToPromote
    };
  }

  private buildActivitySummary(
    stockMovements: StockMovement[],
    wasteEvents: WasteEvent[]
  ): DashboardActivitySummary {
    const recentStockMovements = [...stockMovements]
      .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
      .slice(0, this.maxRecentActivityItems)
      .map((movement) => ({
        id: movement.id,
        movementType: movement.movementType,
        source: movement.source,
        ingredientName: movement.ingredientName,
        recipeName: movement.recipeName,
        quantity: movement.quantity,
        unit: movement.unit,
        totalCost: movement.totalCost,
        occurredAt: movement.occurredAt
      }));

    const recentWasteEvents = [...wasteEvents]
      .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
      .slice(0, this.maxRecentActivityItems)
      .map((event) => ({
        id: event.id,
        ingredientName: event.ingredientName,
        quantityWasted: event.quantityWasted,
        unit: event.unit,
        totalCost: event.totalCost,
        reason: event.reason,
        occurredAt: event.occurredAt
      }));

    return {
      recentStockMovements,
      recentWasteEvents
    };
  }

  private buildTopWastedIngredients(
    wasteEvents: WasteEvent[]
  ): DashboardTopWastedIngredient[] {
    const grouped = wasteEvents.reduce((summary, event) => {
      const current = summary.get(event.ingredientId) ?? {
        ingredientId: event.ingredientId,
        ingredientName: event.ingredientName,
        totalWasteCost: 0,
        quantityWasted: 0,
        eventCount: 0
      };

      current.totalWasteCost += event.totalCost;
      current.quantityWasted += event.quantityWasted;
      current.eventCount += 1;

      summary.set(event.ingredientId, current);

      return summary;
    }, new Map<string, DashboardTopWastedIngredient>());

    return Array.from(grouped.values())
      .map((item) => ({
        ...item,
        totalWasteCost: this.roundMoney(item.totalWasteCost),
        quantityWasted: this.roundQuantity(item.quantityWasted)
      }))
      .sort((a, b) => b.totalWasteCost - a.totalWasteCost)
      .slice(0, this.maxTopWastedIngredients);
  }

  private countLowStockIngredients(
    inventoryBatches: InventoryBatch[],
    ingredients: Ingredient[]
  ): number {
    const totalsByIngredient = inventoryBatches.reduce((summary, batch) => {
      const current = summary.get(batch.ingredientId) ?? 0;

      summary.set(batch.ingredientId, current + batch.quantityAvailable);

      return summary;
    }, new Map<string, number>());

    return ingredients.filter((ingredient) => {
      const availableQuantity = totalsByIngredient.get(ingredient.id) ?? 0;
      const lowStockThreshold =
        ingredient.lowStockThresholdQuantity ?? this.createDefaultLowStockThreshold(ingredient.baseUnit);

      return availableQuantity > 0 && availableQuantity < lowStockThreshold;
    }).length;
  }

  private createDefaultLowStockThreshold(baseUnit: Ingredient['baseUnit']): number {
    if (baseUnit === 'UNIT') {
      return 10;
    }
    // else if(baseUnit === 'GRAM'){
    //   return 1;
    // }

    return 500;
  }

  private roundMoney(value: number): number {
    return Number(value.toFixed(4));
  }

  private calculateGrossMarginPercentage(input: {
    estimatedGrossProfit: number;
    totalSalesRevenue: number;
  }): number {
    if (input.totalSalesRevenue <= 0) {
      return 0;
    }

    return Number(
      ((input.estimatedGrossProfit / input.totalSalesRevenue) * 100).toFixed(2)
    );
  }

  private roundQuantity(value: number): number {
    return Number(value.toFixed(4));
  }

  private buildLowStockIngredients(
    inventoryBatches: InventoryBatch[],
    ingredients: Ingredient[]
  ): DashboardLowStockIngredient[] {
    const totalsByIngredient = inventoryBatches.reduce((summary, batch) => {
      const current = summary.get(batch.ingredientId) ?? 0;

      summary.set(batch.ingredientId, current + batch.quantityAvailable);

      return summary;
    }, new Map<string, number>());

    return ingredients
      .map((ingredient) => {
        const availableQuantity = totalsByIngredient.get(ingredient.id) ?? 0;

        return {
          ingredientId: ingredient.id,
          ingredientName: ingredient.name,
          availableQuantity: this.roundQuantity(availableQuantity),
          lowStockThresholdQuantity: ingredient.lowStockThresholdQuantity,
          shortageQuantity: this.roundQuantity(ingredient.lowStockThresholdQuantity - availableQuantity),
          unit: ingredient.baseUnit
        };
      })
      .filter((ingredient) => {
        return ingredient.availableQuantity > 0 && ingredient.availableQuantity < ingredient.lowStockThresholdQuantity;
      })
      .sort((a, b) => b.shortageQuantity - a.shortageQuantity);
  }
}
