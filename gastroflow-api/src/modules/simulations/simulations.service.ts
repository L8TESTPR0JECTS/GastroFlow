import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { nowIso } from '../../common/utils/date.util';
import { CreateInventoryBatchDto } from '../inventory-batches/dto/create-inventory-batch.dto';
import type { InventoryBatch } from '../inventory-batches/models/inventory-batch.model';
import { InventoryBatchesService } from '../inventory-batches/inventory-batches.service';
import { InventoryBatchesRepository } from '../inventory-batches/repositories/inventory-batches.repository';
import type { Recipe } from '../recipes/models/recipe.model';
import { RecipesService } from '../recipes/recipes.service';
import { RecommendationsService } from '../recommendations/recommendations.service';
import { RestaurantsService } from '../restaurants/restaurants.service';
import { CreateRecipeSaleConsumptionDto } from '../stock-consumptions/dto/create-recipe-sale-consumption.dto';
import { StockConsumptionsService } from '../stock-consumptions/stock-consumptions.service';
import { CreateWasteEventDto } from '../waste-events/dto/create-waste-event.dto';
import { WasteEventsService } from '../waste-events/waste-events.service';
import type { RunSimulationDto } from './dto/run-simulation.dto';
import type {
  SimulationAction,
  SimulationResult,
  SimulationSummary,
  SimulationTimelineEvent,
  SimulationType
} from './models/simulation.model';
import { SimulationPlanningService } from './simulation-planning.service';
import {
  pickRandomItem,
  randomIntegerBetween
} from './planning/simulation-random.util';
import { createSeededRandom } from './planning/simulation-random.util';

@Injectable()
export class SimulationsService {
  constructor(
    private readonly restaurantsService: RestaurantsService,
    private readonly simulationPlanningService: SimulationPlanningService,
    private readonly recipesService: RecipesService,
    private readonly inventoryBatchesService: InventoryBatchesService,
    private readonly inventoryBatchesRepository: InventoryBatchesRepository,
    private readonly stockConsumptionsService: StockConsumptionsService,
    private readonly wasteEventsService: WasteEventsService,
    private readonly recommendationsService: RecommendationsService
  ) { }

  async runSimulation(
    restaurantId: string,
    dto: RunSimulationDto
  ): Promise<SimulationResult> {
    const restaurant = await this.restaurantsService.getRestaurantById(restaurantId);

    const plannedResult = this.simulationPlanningService.planSimulation(
      restaurantId,
      dto,
      restaurant.timezone
    );
    const simulationType = plannedResult.simulationType;
    const random = createSeededRandom(dto.seed);
    const actions: SimulationAction[] = [];

    const recipes = await this.recipesService.listRecipes(restaurantId, { status: 'ACTIVE', isActive: 'true' });

    for (const event of plannedResult.timeline) {
      const eventActions = await this.executeTimelineEvent({
        restaurantId,
        event,
        recipes,
        random,
        notes: dto.notes,
        simulationType
      });

      actions.push(...eventActions);
    }

    const completedAt = nowIso();

    return {
      ...plannedResult,
      completedAt,
      actions,
      summary: this.buildSimulationSummary(plannedResult.timeline, actions)
    };
  }

  private async executeTimelineEvent(input: {
    restaurantId: string;
    event: SimulationTimelineEvent;
    recipes: Recipe[];
    random: () => number;
    notes?: string;
    simulationType: SimulationType;
  }): Promise<SimulationAction[]> {
    switch (input.event.eventType) {
      case 'RECIPE_SALE':
        return this.executeRecipeSale({
          ...input,
          quantityOverride:
            input.simulationType === 'LUNCH_RUSH'
              ? randomIntegerBetween(input.random, 2, 6)
              : undefined
        });

      case 'RUSH_SPIKE':
        if (input.simulationType === 'LUNCH_RUSH') {
          return this.executeRushSpike({
            ...input,
            random: () => input.random() * 0.8
          });
        }

        return this.executeRushSpike(input);

      case 'SUPPLIER_DELIVERY':
        if (input.simulationType === 'OVERBUYING') {
          return this.executeBulkDelivery(input);
        }

        return this.executeSupplierDelivery(input);

      case 'WASTE_EVENT':
        return this.executeWasteEvent(input);

      case 'RECOMMENDATION_GENERATION':
        return this.executeRecommendationGeneration(input);

      case 'RECOMMENDATION_APPLIED':
        if (input.simulationType === 'FOLLOW_RECOMMENDATIONS') {
          return this.executeRecommendationBulk({
            ...input,
            isApply: true
          });
        }

        return this.executeRecommendationApplied(input);

      case 'RECOMMENDATION_DISMISSED':
        if (input.simulationType === 'IGNORE_RECOMMENDATIONS') {
          return this.executeRecommendationBulk({
            ...input,
            isApply: false
          });
        }

        return this.executeRecommendationDismissed(input);

      case 'QUIET_PERIOD':
        return [
          {
            type: 'QUIET_PERIOD',
            description: input.event.description,
            occurredAt: input.event.scheduledAt,
            metadata: {
              period: input.event.period
            }
          }
        ];
    }
  }

  private async executeBulkDelivery(input: {
    restaurantId: string;
    event: SimulationTimelineEvent;
    recipes: Recipe[];
    random: () => number;
    notes?: string;
  }) {
    const deliveries = randomIntegerBetween(input.random, 3, 7);
    const actions: SimulationAction[] = [];

    for (let i = 0; i < deliveries; i++) {
      const result = await this.executeSupplierDelivery(input);
      actions.push(...result);
    }

    return [
      {
        type: 'OVERBUYING',
        description: `Bulk delivery of ${deliveries} ingredients.`,
        occurredAt: input.event.scheduledAt,
        quantity: deliveries
      },
      ...actions
    ];
  }

  private async executeRecommendationBulk(input: {
    restaurantId: string;
    event: SimulationTimelineEvent;
    recipes: Recipe[];
    random: () => number;
    notes?: string;
    isApply: boolean;
  }): Promise<SimulationAction[]> {
    const count = randomIntegerBetween(input.random, 2, 5);
    const actions: SimulationAction[] = [];

    for (let i = 0; i < count; i += 1) {
      const result = input.isApply
        ? await this.executeRecommendationApplied(input)
        : await this.executeRecommendationDismissed(input);

      if (result.length > 0 && result[0].type !== 'SKIPPED') {
        actions.push(...result);
      }
    }

    if (actions.length === 0) {
      return [
        {
          type: 'SKIPPED',
          description: `Bulk recommendation ${
            input.isApply ? 'application' : 'dismissal'
          } skipped. No applicable recommendations.`,
          occurredAt: input.event.scheduledAt,
          metadata: {
            originalEventType: input.event.eventType
          }
        }
      ];
    }

    return [
      {
        type: input.isApply ? 'RECOMMENDATION_APPLIED' : 'RECOMMENDATION_DISMISSED',
        description: `Bulk ${
          input.isApply ? 'applied' : 'dismissed'
        } ${actions.length} recommendations.`,
        occurredAt: input.event.scheduledAt,
        quantity: actions.length,
        metadata: {
          mode: 'BULK',
          attempted: count,
          successful: actions.length
        }
      },
      ...actions
    ];
  }

  private async executeRecipeSale(input: {
    restaurantId: string;
    event: SimulationTimelineEvent;
    recipes: Recipe[];
    random: () => number;
    notes?: string;
    quantityOverride?: number;
  }): Promise<SimulationAction[]> {
    if (input.recipes.length === 0) {
      return [this.createSkippedAction(input.event, 'No active recipes were available for sale simulation.')];
    }

    const recipe = pickRandomItem(input.random, input.recipes);
    const quantitySold = input.quantityOverride ?? randomIntegerBetween(input.random, 1, 4);

    try {
      const dto: CreateRecipeSaleConsumptionDto = {
        recipeId: recipe.id,
        quantitySold,
        notes: input.notes ?? `Simulation sale during ${input.event.period}.`
      };

      const result = await this.stockConsumptionsService.consumeRecipeSale(input.restaurantId, dto);

      return [
        {
          type: 'RECIPE_SALE',
          description: `Sold ${quantitySold} x ${recipe.name}.`,
          occurredAt: input.event.scheduledAt,
          entityId: recipe.id,
          entityName: recipe.name,
          quantity: quantitySold,
          metadata: {
            totalConsumptionCost: result.inventoryCostConsumed,
            movementCount: result.movements.length
          }
        }
      ];
    } catch (error) {
      return [
        this.createSkippedAction(
          input.event,
          `Recipe sale skipped for ${recipe.name}. ${this.getErrorMessage(error)}`
        )
      ];
    }
  }

  private async executeRushSpike(input: {
    restaurantId: string;
    event: SimulationTimelineEvent;
    recipes: Recipe[];
    random: () => number;
    notes?: string;
  }): Promise<SimulationAction[]> {
    const saleCount = randomIntegerBetween(input.random, 2, 5);
    const actions: SimulationAction[] = [];

    for (let index = 0; index < saleCount; index += 1) {
      const saleActions = await this.executeRecipeSale(input);

      actions.push(...saleActions);
    }

    actions.unshift({
      type: 'RUSH_SPIKE',
      description: `Rush spike generated ${saleCount} sale attempts.`,
      occurredAt: input.event.scheduledAt,
      quantity: saleCount,
      metadata: {
        period: input.event.period
      }
    });

    return actions;
  }

  private async executeSupplierDelivery(input: {
    restaurantId: string;
    event: SimulationTimelineEvent;
    recipes: Recipe[];
    random: () => number;
    notes?: string;
  }): Promise<SimulationAction[]> {
    const ingredientsFromRecipes = input.recipes.flatMap((recipe) => recipe.ingredients);

    if (ingredientsFromRecipes.length === 0) {
      return [this.createSkippedAction(input.event, 'No recipe ingredients were available for supplier delivery simulation.')];
    }

    const selectedLine = pickRandomItem(input.random, ingredientsFromRecipes);
    const quantityReceived = randomIntegerBetween(input.random, 1000, 6000);
    const unitCost = this.randomUnitCost(input.random);

    try {
      const defaultLocationId = await this.resolveDefaultLocationId(input.restaurantId);

      const dto: CreateInventoryBatchDto = {
        ingredientId: selectedLine.ingredientId,
        locationId: defaultLocationId,
        quantityReceived,
        unitCost,
        receivedAt: input.event.scheduledAt,
        notes: input.notes ?? `Simulation supplier delivery during ${input.event.period}.`
      };

      const batch = await this.inventoryBatchesService.createInventoryBatch(input.restaurantId, dto);

      return [
        {
          type: 'SUPPLIER_DELIVERY',
          description: `Received ${quantityReceived} ${batch.unit} of ${batch.ingredientName}.`,
          occurredAt: input.event.scheduledAt,
          entityId: batch.id,
          entityName: batch.ingredientName,
          quantity: quantityReceived,
          metadata: {
            unit: batch.unit,
            unitCost: batch.unitCost,
            totalCost: batch.totalCost
          }
        }
      ];
    } catch (error) {
      return [
        this.createSkippedAction(
          input.event,
          `Supplier delivery skipped. ${this.getErrorMessage(error)}`
        )
      ];
    }
  }

  private async executeWasteEvent(input: {
    restaurantId: string;
    event: SimulationTimelineEvent;
    recipes: Recipe[];
    random: () => number;
    notes?: string;
  }): Promise<SimulationAction[]> {
    const availableBatches = await this.inventoryBatchesRepository.findInventoryBatchesByRestaurantId(input.restaurantId, { isActive: true });
    const wasteCandidates = availableBatches.filter((batch) => {
      return batch.quantityAvailable > 0 && batch.status !== 'DEPLETED' && batch.status !== 'WASTED';
    });

    if (wasteCandidates.length === 0) {
      return [this.createSkippedAction(input.event, 'No available inventory batches were available for waste simulation.')];
    }

    const batch = pickRandomItem(input.random, wasteCandidates);
    const maxWasteQuantity = Math.max(1, Math.floor(batch.quantityAvailable * 0.35));
    const quantityWasted = randomIntegerBetween(input.random, 1, maxWasteQuantity);

    try {
      const dto: CreateWasteEventDto = {
        inventoryBatchId: batch.id,
        quantityWasted,
        reason: 'SPOILED',
        notes: input.notes ?? `Simulation waste event during ${input.event.period}.`
      };

      const result = await this.wasteEventsService.createWasteEvent(input.restaurantId, dto);

      return [
        {
          type: 'WASTE_EVENT',
          description: `Wasted ${quantityWasted} ${batch.unit} of ${batch.ingredientName}.`,
          occurredAt: input.event.scheduledAt,
          entityId: result.wasteEvent.id,
          entityName: batch.ingredientName,
          quantity: quantityWasted,
          metadata: {
            reason: result.wasteEvent.reason,
            totalCost: result.wasteEvent.totalCost,
            inventoryBatchId: batch.id
          }
        }
      ];
    } catch (error) {
      return [
        this.createSkippedAction(
          input.event,
          `Waste event skipped for ${batch.ingredientName}. ${this.getErrorMessage(error)}`
        )
      ];
    }
  }

  private async executeRecommendationGeneration(input: {
    restaurantId: string;
    event: SimulationTimelineEvent;
    recipes: Recipe[];
    random: () => number;
    notes?: string;
  }): Promise<SimulationAction[]> {
    const result = await this.recommendationsService.generateRecommendations(input.restaurantId, {
      notes: input.notes ?? `Simulation recommendation refresh during ${input.event.period}.`
    });

    return [
      {
        type: 'RECOMMENDATION_GENERATION',
        description: `Generated ${result.generatedCount} recommendations.`,
        occurredAt: input.event.scheduledAt,
        quantity: result.generatedCount,
        metadata: {
          generatedCount: result.generatedCount
        }
      }
    ];
  }

  private async executeRecommendationApplied(input: {
    restaurantId: string;
    event: SimulationTimelineEvent;
    recipes: Recipe[];
    random: () => number;
    notes?: string;
  }): Promise<SimulationAction[]> {
    const recommendations = await this.recommendationsService.listRecommendations(input.restaurantId, { status: 'OPEN' });

    if (recommendations.length === 0) {
      return [this.createSkippedAction(input.event, 'No open recommendations were available to apply.')];
    }

    const recommendation = pickRandomItem(input.random, recommendations);
    const updated = await this.recommendationsService.applyRecommendation(input.restaurantId, recommendation.id);

    return [
      {
        type: 'RECOMMENDATION_APPLIED',
        description: `Applied recommendation: ${updated.title}.`,
        occurredAt: input.event.scheduledAt,
        entityId: updated.id,
        entityName: updated.title
      }
    ];
  }

  private async executeRecommendationDismissed(input: {
    restaurantId: string;
    event: SimulationTimelineEvent;
    recipes: Recipe[];
    random: () => number;
    notes?: string;
  }): Promise<SimulationAction[]> {
    const recommendations = await this.recommendationsService.listRecommendations(input.restaurantId, { status: 'OPEN' });

    if (recommendations.length === 0) {
      return [this.createSkippedAction(input.event, 'No open recommendations were available to dismiss.')];
    }

    const recommendation = pickRandomItem(input.random, recommendations);
    const updated = await this.recommendationsService.dismissRecommendation(input.restaurantId, recommendation.id);

    return [
      {
        type: 'RECOMMENDATION_DISMISSED',
        description: `Dismissed recommendation: ${updated.title}.`,
        occurredAt: input.event.scheduledAt,
        entityId: updated.id,
        entityName: updated.title
      }
    ];
  }

  private buildSimulationSummary(
    timeline: SimulationTimelineEvent[],
    actions: SimulationAction[]
  ): SimulationSummary {
    return {
      timelineEventCount: timeline.length,
      stockConsumptionCount: actions.filter((action) => action.type === 'RECIPE_SALE').length,
      wasteEventCount: actions.filter((action) => action.type === 'WASTE_EVENT').length,
      inventoryBatchCount: actions.filter((action) => action.type === 'SUPPLIER_DELIVERY').length,
      recommendationsAppliedCount: actions.filter((action) => action.type === 'RECOMMENDATION_APPLIED').length,
      recommendationsDismissedCount: actions.filter((action) => action.type === 'RECOMMENDATION_DISMISSED').length,
      recommendationsGeneratedCount: actions
        .filter((action) => action.type === 'RECOMMENDATION_GENERATION')
        .reduce((total, action) => total + (action.quantity ?? 0), 0),
      quietPeriodCount: timeline.filter((event) => event.eventType === 'QUIET_PERIOD').length,
      rushSpikeCount: timeline.filter((event) => event.eventType === 'RUSH_SPIKE').length,
      totalEstimatedSales: actions
        .filter((action) => action.type === 'RECIPE_SALE')
        .reduce((total, action) => total + (action.quantity ?? 0), 0),
      totalWasteCost: this.roundMoney(
        actions
          .filter((action) => action.type === 'WASTE_EVENT')
          .reduce((total, action) => {
            const totalCost = Number(action.metadata?.totalCost ?? 0);

            return total + totalCost;
          }, 0)
      )
    };
  }

  private createSkippedAction(
    event: SimulationTimelineEvent,
    reason: string
  ): SimulationAction {
    return {
      type: 'SKIPPED',
      description: reason,
      occurredAt: event.scheduledAt,
      metadata: {
        originalEventType: event.eventType,
        period: event.period
      }
    };
  }

  private async resolveDefaultLocationId(restaurantId: string): Promise<string> {
    const defaultLocation = await this.restaurantsService.getDefaultLocation(restaurantId);

    return defaultLocation.id;
  }

  private randomUnitCost(random: () => number): number {
    return this.roundMoney(0.005 + random() * 0.025);
  }

  private roundMoney(value: number): number {
    return Number(value.toFixed(4));
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    return 'Unknown error.';
  }
}
