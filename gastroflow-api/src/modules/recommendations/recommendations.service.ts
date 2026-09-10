import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { createAuditTimestamps } from '../../common/utils/audit.util';
import { nowIso } from '../../common/utils/date.util';
import type { InventoryBatch } from '../inventory-batches/models/inventory-batch.model';
import { InventoryBatchesRepository } from '../inventory-batches/repositories/inventory-batches.repository';
import type { Recipe } from '../recipes/models/recipe.model';
import { RecipesService } from '../recipes/recipes.service';
import { RestaurantsService } from '../restaurants/restaurants.service';
import type { WasteEvent } from '../waste-events/models/waste-event.model';
import { WasteEventsRepository } from '../waste-events/repositories/waste-events.repository';
import type { GenerateRecommendationsDto } from './dto/generate-recommendations.dto';
import type { ListRecommendationsQueryDto } from './dto/list-recommendations-query.dto';
import type { GenerateRecommendationsResult } from './models/generate-recommendations-result.model';
import type {
  Recommendation,
  RecommendationPriority,
  RecommendationType,
} from './models/recommendation.model';
import type { RecommendationListFilters } from './repositories/recommendations.repository';
import { RecommendationsRepository } from './repositories/recommendations.repository';

@Injectable()
export class RecommendationsService {
  constructor(
    private readonly restaurantsService: RestaurantsService,
    private readonly inventoryBatchesRepository: InventoryBatchesRepository,
    private readonly recipesService: RecipesService,
    private readonly wasteEventsRepository: WasteEventsRepository,
    private readonly recommendationsRepository: RecommendationsRepository,
  ) {}

  async generateRecommendations(
    restaurantId: string,
    _dto: GenerateRecommendationsDto,
  ): Promise<GenerateRecommendationsResult> {
    await this.restaurantsService.getRestaurantById(restaurantId);

    const [inventoryBatches, recipes, wasteEvents] = await Promise.all([
      this.inventoryBatchesRepository.findInventoryBatchesByRestaurantId(
        restaurantId,
        { isActive: true },
      ),
      this.recipesService.listRecipes(restaurantId, {
        status: 'ACTIVE',
        isActive: 'true',
      }),
      this.wasteEventsRepository.findWasteEventsByRestaurantId(restaurantId),
    ]);

    const recommendations: Recommendation[] = [
      ...this.generateUseSoonRecommendations({
        restaurantId,
        inventoryBatches,
        recipes,
      }),
      ...this.generateLowStockRiskRecommendations({
        restaurantId,
        inventoryBatches,
        recipes,
      }),
      ...this.generateOverstockRiskRecommendations({
        restaurantId,
        inventoryBatches,
        recipes,
      }),
      ...this.generateWastePatternRecommendations({
        restaurantId,
        wasteEvents,
      }),
      ...this.generatePromoteRecipeRecommendations({
        restaurantId,
        inventoryBatches,
        recipes,
      }),
      ...this.generateHighMarginRecommendations({
        restaurantId,
        inventoryBatches,
        recipes,
      }),
    ];

    const savedRecommendations =
      await this.recommendationsRepository.createRecommendations(
        recommendations,
      );

    return {
      restaurantId,
      generatedCount: savedRecommendations.length,
      recommendations: savedRecommendations,
    };
  }

  async listRecommendations(
    restaurantId: string,
    query: ListRecommendationsQueryDto,
  ): Promise<Recommendation[]> {
    await this.restaurantsService.getRestaurantById(restaurantId);

    return this.recommendationsRepository.findRecommendationsByRestaurantId(
      restaurantId,
      this.buildRecommendationFilters(query),
    );
  }

  async getRecommendationById(
    restaurantId: string,
    recommendationId: string,
  ): Promise<Recommendation> {
    await this.restaurantsService.getRestaurantById(restaurantId);

    return this.recommendationsRepository.findRecommendationById(
      restaurantId,
      recommendationId,
    );
  }

  async applyRecommendation(
    restaurantId: string,
    recommendationId: string,
  ): Promise<Recommendation> {
    await this.restaurantsService.getRestaurantById(restaurantId);

    return this.recommendationsRepository.updateRecommendationStatus(
      restaurantId,
      recommendationId,
      'APPLIED',
      nowIso(),
    );
  }

  async dismissRecommendation(
    restaurantId: string,
    recommendationId: string,
  ): Promise<Recommendation> {
    await this.restaurantsService.getRestaurantById(restaurantId);

    return this.recommendationsRepository.updateRecommendationStatus(
      restaurantId,
      recommendationId,
      'DISMISSED',
      nowIso(),
    );
  }

  private generateUseSoonRecommendations(input: {
    restaurantId: string;
    inventoryBatches: InventoryBatch[];
    recipes: Recipe[];
  }): Recommendation[] {
    const now = Date.now();
    const threeDaysMs = 3 * 24 * 60 * 60 * 1000;

    return input.inventoryBatches
      .filter((batch) => batch.quantityAvailable > 0)
      .filter((batch) => {
        const expiresAt = new Date(batch.expiresAt).getTime();

        return expiresAt >= now && expiresAt - now <= threeDaysMs;
      })
      .map((batch) => {
        const relatedRecipes = this.findRecipesUsingIngredient(
          input.recipes,
          batch.ingredientId,
        );

        return this.createRecommendation({
          restaurantId: input.restaurantId,
          type: 'USE_SOON',
          priority: 'HIGH',
          title: `Use ${batch.ingredientName} soon`,
          message: `${batch.ingredientName} has ${batch.quantityAvailable} ${batch.unit} available and expires soon. Consider using recipes that include this ingredient.`,
          ingredientId: batch.ingredientId,
          ingredientName: batch.ingredientName,
          relatedRecipeIds: relatedRecipes.map((recipe) => recipe.id),
          relatedInventoryBatchIds: [batch.id],
          reasonCode: 'BATCH_EXPIRES_WITHIN_3_DAYS',
        });
      });
  }

  private generateLowStockRiskRecommendations(input: {
    restaurantId: string;
    inventoryBatches: InventoryBatch[];
    recipes: Recipe[];
  }): Recommendation[] {
    const quantityByIngredientId = this.sumAvailableQuantityByIngredient(
      input.inventoryBatches,
    );

    const recipeDemandByIngredientId = this.sumRecipeDemandByIngredient(
      input.recipes,
    );

    const recommendations: Recommendation[] = [];

    recipeDemandByIngredientId.forEach((recipeDemand, ingredientId) => {
      const available = quantityByIngredientId.get(ingredientId) ?? 0;

      if (available > 0 && available < recipeDemand * 3) {
        const recipe = input.recipes.find((currentRecipe) =>
          currentRecipe.ingredients.some(
            (line) => line.ingredientId === ingredientId,
          ),
        );

        const ingredientName =
          recipe?.ingredients.find(
            (line) => line.ingredientId === ingredientId,
          )?.ingredientName ?? ingredientId;

        recommendations.push(
          this.createRecommendation({
            restaurantId: input.restaurantId,
            type: 'LOW_STOCK_RISK',
            priority: 'MEDIUM',
            title: `${ingredientName} may run low soon`,
            message: `${ingredientName} has limited available stock compared to recipe usage. Consider monitoring it before the next rush.`,
            ingredientId,
            ingredientName,
            relatedRecipeIds: this.findRecipesUsingIngredient(
              input.recipes,
              ingredientId,
            ).map((currentRecipe) => currentRecipe.id),
            relatedInventoryBatchIds: input.inventoryBatches
              .filter((batch) => batch.ingredientId === ingredientId)
              .map((batch) => batch.id),
            reasonCode: 'AVAILABLE_STOCK_BELOW_RECIPE_USAGE_THRESHOLD',
          }),
        );
      }
    });

    return recommendations;
  }

  private generateOverstockRiskRecommendations(input: {
    restaurantId: string;
    inventoryBatches: InventoryBatch[];
    recipes: Recipe[];
  }): Recommendation[] {
    const quantityByIngredientId = this.sumAvailableQuantityByIngredient(
      input.inventoryBatches,
    );

    const recipeDemandByIngredientId = this.sumRecipeDemandByIngredient(
      input.recipes,
    );

    const recommendations: Recommendation[] = [];

    quantityByIngredientId.forEach((available, ingredientId) => {
      const recipeDemand = recipeDemandByIngredientId.get(ingredientId) ?? 0;

      if (recipeDemand > 0 && available > recipeDemand * 20) {
        const batch = input.inventoryBatches.find(
          (currentBatch) => currentBatch.ingredientId === ingredientId,
        );

        if (!batch) {
          return;
        }

        recommendations.push(
          this.createRecommendation({
            restaurantId: input.restaurantId,
            type: 'OVERSTOCK_RISK',
            priority: 'MEDIUM',
            title: `${batch.ingredientName} may be overstocked`,
            message: `${batch.ingredientName} has high available quantity compared to current recipe usage. Consider reducing future purchases or promoting recipes that use it.`,
            ingredientId,
            ingredientName: batch.ingredientName,
            relatedRecipeIds: this.findRecipesUsingIngredient(
              input.recipes,
              ingredientId,
            ).map((recipe) => recipe.id),
            relatedInventoryBatchIds: input.inventoryBatches
              .filter((currentBatch) => currentBatch.ingredientId === ingredientId)
              .map((currentBatch) => currentBatch.id),
            reasonCode: 'AVAILABLE_STOCK_ABOVE_RECIPE_USAGE_THRESHOLD',
          }),
        );
      }
    });

    return recommendations;
  }

  private generateWastePatternRecommendations(input: {
    restaurantId: string;
    wasteEvents: WasteEvent[];
  }): Recommendation[] {
    const wasteByIngredientId = new Map<
      string,
      {
        ingredientName: string;
        totalWasteCost: number;
        eventCount: number;
      }
    >();

    input.wasteEvents.forEach((event) => {
      const current = wasteByIngredientId.get(event.ingredientId) ?? {
        ingredientName: event.ingredientName,
        totalWasteCost: 0,
        eventCount: 0,
      };

      current.totalWasteCost += event.totalCost;
      current.eventCount += 1;

      wasteByIngredientId.set(event.ingredientId, current);
    });

    const recommendations: Recommendation[] = [];

    wasteByIngredientId.forEach((summary, ingredientId) => {
      if (summary.eventCount >= 2 || summary.totalWasteCost >= 10) {
        recommendations.push(
          this.createRecommendation({
            restaurantId: input.restaurantId,
            type: 'WASTE_PATTERN_DETECTED',
            priority: 'HIGH',
            title: `${summary.ingredientName} waste pattern detected`,
            message: `${summary.ingredientName} has repeated waste events or meaningful waste cost. Consider buying less, storing differently, or promoting recipes that use it sooner.`,
            ingredientId,
            ingredientName: summary.ingredientName,
            relatedRecipeIds: [],
            relatedInventoryBatchIds: [],
            reasonCode: 'REPEATED_OR_COSTLY_WASTE_EVENTS',
          }),
        );
      }
    });

    return recommendations;
  }

  private generatePromoteRecipeRecommendations(input: {
    restaurantId: string;
    inventoryBatches: InventoryBatch[];
    recipes: Recipe[];
  }): Recommendation[] {
    const availableIngredientIds = new Set(
      input.inventoryBatches
        .filter((batch) => batch.quantityAvailable > 0)
        .map((batch) => batch.ingredientId),
    );

    return input.recipes
      .filter((recipe) =>
        recipe.ingredients.every((line) =>
          availableIngredientIds.has(line.ingredientId),
        ),
      )
      .slice(0, 5)
      .map((recipe) =>
        this.createRecommendation({
          restaurantId: input.restaurantId,
          type: 'PROMOTE_RECIPE',
          priority: 'MEDIUM',
          title: `Promote ${recipe.name}`,
          message: `${recipe.name} can be prepared with currently available inventory. Consider featuring it to convert stock into revenue.`,
          recipeId: recipe.id,
          recipeName: recipe.name,
          relatedRecipeIds: [recipe.id],
          relatedInventoryBatchIds: this.findBatchesForRecipe(
            input.inventoryBatches,
            recipe,
          ).map((batch) => batch.id),
          reasonCode: 'RECIPE_CAN_BE_PREPARED_WITH_AVAILABLE_STOCK',
        }),
      );
  }

  private generateHighMarginRecommendations(input: {
    restaurantId: string;
    inventoryBatches: InventoryBatch[];
    recipes: Recipe[];
  }): Recommendation[] {
    const availableIngredientIds = new Set(
      input.inventoryBatches
        .filter((batch) => batch.quantityAvailable > 0)
        .map((batch) => batch.ingredientId),
    );

    return input.recipes
      .filter((recipe) => recipe.estimatedGrossMarginPercentage >= 65)
      .filter((recipe) =>
        recipe.ingredients.every((line) =>
          availableIngredientIds.has(line.ingredientId),
        ),
      )
      .slice(0, 5)
      .map((recipe) =>
        this.createRecommendation({
          restaurantId: input.restaurantId,
          type: 'HIGH_MARGIN_OPPORTUNITY',
          priority: 'HIGH',
          title: `${recipe.name} has strong margin`,
          message: `${recipe.name} has an estimated gross margin of ${recipe.estimatedGrossMarginPercentage}%. Consider promoting it when inventory is available.`,
          recipeId: recipe.id,
          recipeName: recipe.name,
          relatedRecipeIds: [recipe.id],
          relatedInventoryBatchIds: this.findBatchesForRecipe(
            input.inventoryBatches,
            recipe,
          ).map((batch) => batch.id),
          reasonCode: 'HIGH_MARGIN_RECIPE_WITH_AVAILABLE_STOCK',
        }),
      );
  }

  private createRecommendation(input: {
    restaurantId: string;
    type: RecommendationType;
    priority: RecommendationPriority;
    title: string;
    message: string;
    ingredientId?: string;
    ingredientName?: string;
    recipeId?: string;
    recipeName?: string;
    relatedRecipeIds: string[];
    relatedInventoryBatchIds: string[];
    reasonCode: string;
  }): Recommendation {
    const audit = createAuditTimestamps();

    return {
      id: `recommendation_${input.restaurantId}_${randomUUID()}`,
      restaurantId: input.restaurantId,
      type: input.type,
      priority: input.priority,
      title: input.title,
      message: input.message,
      status: 'OPEN',
      relatedRecipeIds: input.relatedRecipeIds,
      relatedInventoryBatchIds: input.relatedInventoryBatchIds,
      reasonCode: input.reasonCode,
      ...audit,
      ...(input.ingredientId !== undefined
        ? { ingredientId: input.ingredientId }
        : {}),
      ...(input.ingredientName !== undefined
        ? { ingredientName: input.ingredientName }
        : {}),
      ...(input.recipeId !== undefined ? { recipeId: input.recipeId } : {}),
      ...(input.recipeName !== undefined
        ? { recipeName: input.recipeName }
        : {}),
    };
  }

  private findRecipesUsingIngredient(
    recipes: Recipe[],
    ingredientId: string,
  ): Recipe[] {
    return recipes.filter((recipe) =>
      recipe.ingredients.some((line) => line.ingredientId === ingredientId),
    );
  }

  private findBatchesForRecipe(
    inventoryBatches: InventoryBatch[],
    recipe: Recipe,
  ): InventoryBatch[] {
    const ingredientIds = new Set(
      recipe.ingredients.map((line) => line.ingredientId),
    );

    return inventoryBatches.filter((batch) =>
      ingredientIds.has(batch.ingredientId),
    );
  }

  private sumAvailableQuantityByIngredient(
    inventoryBatches: InventoryBatch[],
  ): Map<string, number> {
    const totals = new Map<string, number>();

    inventoryBatches.forEach((batch) => {
      const current = totals.get(batch.ingredientId) ?? 0;

      totals.set(
        batch.ingredientId,
        Number((current + batch.quantityAvailable).toFixed(4)),
      );
    });

    return totals;
  }

  private sumRecipeDemandByIngredient(recipes: Recipe[]): Map<string, number> {
    const totals = new Map<string, number>();

    recipes.forEach((recipe) => {
      recipe.ingredients.forEach((line) => {
        const current = totals.get(line.ingredientId) ?? 0;

        totals.set(
          line.ingredientId,
          Number((current + line.quantity).toFixed(4)),
        );
      });
    });

    return totals;
  }

  private buildRecommendationFilters(
    query: ListRecommendationsQueryDto,
  ): RecommendationListFilters {
    const filters: RecommendationListFilters = {};

    if (query.type) {
      filters.type = query.type;
    }

    if (query.priority) {
      filters.priority = query.priority;
    }

    if (query.status) {
      filters.status = query.status;
    }

    if (query.ingredientId) {
      filters.ingredientId = query.ingredientId;
    }

    if (query.recipeId) {
      filters.recipeId = query.recipeId;
    }

    return filters;
  }
}
