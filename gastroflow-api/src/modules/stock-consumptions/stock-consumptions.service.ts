import {
  BadRequestException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { Firestore } from 'firebase-admin/firestore';
import { FIRESTORE } from '../../common/firestore/firestore.constants';
import { createAuditTimestamps } from '../../common/utils/audit.util';
import { nowIso } from '../../common/utils/date.util';
import { IngredientsService } from '../ingredients/ingredients.service';
import type { StockRotationStrategy } from '../ingredients/models/ingredient.model';
import type {
  InventoryBatch,
  InventoryBatchStatus,
} from '../inventory-batches/models/inventory-batch.model';
import { InventoryBatchesRepository } from '../inventory-batches/repositories/inventory-batches.repository';
import { RecipesService } from '../recipes/recipes.service';
import { RestaurantsService } from '../restaurants/restaurants.service';
import { CreateRecipeSaleConsumptionDto } from './dto/create-recipe-sale-consumption.dto';
import { ListStockMovementsQueryDto } from './dto/list-stock-movements-query.dto';
import type { RecipeSaleConsumptionResult } from './models/recipe-sale-consumption-result.model';
import type {
  StockMovement,
  StockMovementSource,
} from './models/stock-movement.model';
import {
  StockMovementListFilters,
  StockMovementsRepository,
} from './repositories/stock-movements.repository';

import type { StockConsumedEventPayload } from './events/stock-consumed.event';
import { DomainEventEnvelope } from 'src/common/events/domain-event-envelope';
import { createDomainEventEnvelope } from 'src/common/events/domain-event-envelope.factory';
import { OutboxEventsRepository } from '../../common/outbox/repositories/outbox-events.repository';
import { RedisCacheService } from 'src/common/redis/redis-cache.service';

interface PlannedBatchConsumption {
  batch: InventoryBatch;
  quantityToConsume: number;
  remainingQuantityAfterConsumption: number;
  nextStatus: InventoryBatchStatus;
}

interface PlannedIngredientConsumption {
  ingredientId: string;
  ingredientName: string;
  quantityRequired: number;
  quantityConsumed: number;
  totalCost: number;
  batchConsumptions: PlannedBatchConsumption[];
}

@Injectable()
export class StockConsumptionsService {
  constructor(
    private readonly restaurantsService: RestaurantsService,
    private readonly recipesService: RecipesService,
    private readonly ingredientsService: IngredientsService,
    private readonly inventoryBatchesRepository: InventoryBatchesRepository,
    private readonly stockMovementsRepository: StockMovementsRepository,
    @Inject(FIRESTORE)
    private readonly firestore: Firestore,
    private readonly outboxEventsRepository: OutboxEventsRepository,
    private readonly redisCacheService: RedisCacheService
  ) { }

  async consumeRecipeSale(
    restaurantId: string,
    dto: CreateRecipeSaleConsumptionDto,
  ): Promise<RecipeSaleConsumptionResult> {
    await this.restaurantsService.getRestaurantById(restaurantId);

    const recipe = await this.recipesService.getRecipeById(
      restaurantId,
      dto.recipeId,
    );

    if (!recipe.isActive || recipe.status !== 'ACTIVE') {
      throw new BadRequestException(
        `Recipe ${dto.recipeId} is not active and cannot be sold.`,
      );
    }

    const occurredAt = nowIso();

    const recipeIngredients = await Promise.all(
      recipe.ingredients.map(async (recipeIngredientLine) => ({
        recipeIngredientLine,
        ingredient: await this.ingredientsService.getIngredientById(
          restaurantId,
          recipeIngredientLine.ingredientId,
        ),
      })),
    );

    const transactionResult = await this.firestore.runTransaction(
      async (transaction) => {
        const availableBatchGroups = await Promise.all(
          recipeIngredients.map(async ({ ingredient }) => ({
            ingredient,
            availableBatches:
              await this.inventoryBatchesRepository.findAvailableInventoryBatchesForIngredientInTransaction(
                transaction,
                restaurantId,
                ingredient.id,
              ),
          })),
        );

        const plannedConsumptions = recipeIngredients.map(
          ({ recipeIngredientLine, ingredient }) => {
            const quantityRequired =
              recipeIngredientLine.quantity * dto.quantitySold;

            const batchGroup = availableBatchGroups.find(
              (availableBatchGroup) =>
                availableBatchGroup.ingredient.id === ingredient.id,
            );

            const sortedBatches = this.sortBatchesForConsumption(
              batchGroup?.availableBatches ?? [],
              ingredient.stockRotationStrategy,
            );

            return this.planIngredientConsumption({
              ingredientId: ingredient.id,
              ingredientName: ingredient.name,
              quantityRequired,
              batches: sortedBatches,
            });
          },
        );

        const ingredients = plannedConsumptions.map((plannedConsumption) => ({
          ingredientId: plannedConsumption.ingredientId,
          ingredientName: plannedConsumption.ingredientName,
          quantityRequired: plannedConsumption.quantityRequired,
          quantityConsumed: plannedConsumption.quantityConsumed,
          totalCost: plannedConsumption.totalCost,
        }));

        const inventoryCostConsumed = this.roundMoney(
          ingredients.reduce(
            (total, ingredient) => total + ingredient.totalCost,
            0,
          ),
        );

        const unitMenuPrice = recipe.menuPrice;
        const totalSalesRevenue = this.roundMoney(
          unitMenuPrice * dto.quantitySold,
        );
        const estimatedGrossProfit = this.roundMoney(
          totalSalesRevenue - inventoryCostConsumed,
        );
        const estimatedGrossMarginPercentage =
          this.calculateGrossMarginPercentage({
            estimatedGrossProfit,
            totalSalesRevenue,
          });
        const saleId = this.createSaleId(restaurantId);

        const movements = plannedConsumptions.flatMap((plannedConsumption) =>
          plannedConsumption.batchConsumptions.map((batchConsumption) =>
            this.createStockMovement({
              restaurantId,
              recipeId: recipe.id,
              recipeName: recipe.name,
              saleId,
              quantitySold: dto.quantitySold,
              unitMenuPrice,
              totalSalesRevenue,
              inventoryCostConsumed,
              estimatedGrossProfit,
              estimatedGrossMarginPercentage,
              ingredientId: plannedConsumption.ingredientId,
              ingredientName: plannedConsumption.ingredientName,
              inventoryBatchId: batchConsumption.batch.id,
              quantity: batchConsumption.quantityToConsume,
              unit: batchConsumption.batch.unit,
              unitCost: batchConsumption.batch.unitCost,
              source: 'RECIPE_SALE',
              occurredAt,
              notes: dto.notes,
            }),
          ),
        );

        plannedConsumptions.forEach((plannedConsumption) => {
          plannedConsumption.batchConsumptions.forEach((batchConsumption) => {
            this.inventoryBatchesRepository.updateInventoryBatchQuantityAndStatusInTransaction(
              transaction,
              batchConsumption.batch.id,
              {
                quantityAvailable:
                  batchConsumption.remainingQuantityAfterConsumption,
                status: batchConsumption.nextStatus,
                updatedAt: occurredAt,
              },
            );
          });
        });

        const savedMovements =
          this.stockMovementsRepository.createStockMovementsInTransaction(
            transaction,
            movements,
          );

        const result: RecipeSaleConsumptionResult = {
          restaurantId,
          recipeId: recipe.id,
          recipeName: recipe.name,
          quantitySold: dto.quantitySold,
          unitMenuPrice,
          totalSalesRevenue,
          inventoryCostConsumed,
          estimatedGrossProfit,
          estimatedGrossMarginPercentage,
          ingredients,
          movements: savedMovements,
        };

        const event = this.createStockConsumedEvent({
          restaurantId,
          recipeId: recipe.id,
          recipeName: recipe.name,
          quantitySold: dto.quantitySold,
          unitMenuPrice,
          totalSalesRevenue,
          inventoryCostConsumed,
          estimatedGrossProfit,
          estimatedGrossMarginPercentage,
          ingredients,
          movements: savedMovements
        });

        this.outboxEventsRepository.createOutboxEventInTransaction(
          transaction,
          event
        );
        return result;
        
      },
    );
    
    await this.invalidateDashboardCache(restaurantId);
    return transactionResult;
  }

  async listStockMovements(
    restaurantId: string,
    query: ListStockMovementsQueryDto,
  ): Promise<StockMovement[]> {
    await this.restaurantsService.getRestaurantById(restaurantId);

    const filters = this.buildMovementFilters(query);

    return this.stockMovementsRepository.findStockMovementsByRestaurantId(
      restaurantId,
      filters,
    );
  }

  async getStockMovementById(
    restaurantId: string,
    movementId: string,
  ): Promise<StockMovement> {
    await this.restaurantsService.getRestaurantById(restaurantId);

    return this.stockMovementsRepository.findStockMovementById(
      restaurantId,
      movementId,
    );
  }

  private sortBatchesForConsumption(
    batches: InventoryBatch[],
    stockRotationStrategy: StockRotationStrategy,
  ): InventoryBatch[] {
    const batchesCopy = [...batches];

    if (stockRotationStrategy === 'FIFO') {
      return batchesCopy.sort((a, b) =>
        a.receivedAt.localeCompare(b.receivedAt),
      );
    }

    return batchesCopy.sort((a, b) =>
      a.expiresAt.localeCompare(b.expiresAt),
    );
  }

  private planIngredientConsumption(input: {
    ingredientId: string;
    ingredientName: string;
    quantityRequired: number;
    batches: InventoryBatch[];
  }): PlannedIngredientConsumption {
    let remainingQuantityToConsume = input.quantityRequired;
    const batchConsumptions: PlannedBatchConsumption[] = [];

    for (const batch of input.batches) {
      if (remainingQuantityToConsume <= 0) {
        break;
      }

      if (batch.quantityAvailable <= 0) {
        continue;
      }

      const quantityToConsume = Math.min(
        batch.quantityAvailable,
        remainingQuantityToConsume,
      );

      const remainingQuantityAfterConsumption = this.roundQuantity(
        batch.quantityAvailable - quantityToConsume,
      );

      batchConsumptions.push({
        batch,
        quantityToConsume,
        remainingQuantityAfterConsumption,
        nextStatus: this.calculateBatchStatusAfterConsumption(
          batch.quantityReceived,
          remainingQuantityAfterConsumption,
        ),
      });

      remainingQuantityToConsume = this.roundQuantity(
        remainingQuantityToConsume - quantityToConsume,
      );
    }

    if (remainingQuantityToConsume > 0) {
      throw new BadRequestException(
        `Not enough available inventory for ingredient ${input.ingredientName}. Required ${input.quantityRequired}, missing ${remainingQuantityToConsume}.`,
      );
    }

    const quantityConsumed = this.roundQuantity(
      batchConsumptions.reduce(
        (total, batchConsumption) =>
          total + batchConsumption.quantityToConsume,
        0,
      ),
    );

    const totalCost = this.roundMoney(
      batchConsumptions.reduce(
        (total, batchConsumption) =>
          total +
          batchConsumption.quantityToConsume *
          batchConsumption.batch.unitCost,
        0,
      ),
    );

    return {
      ingredientId: input.ingredientId,
      ingredientName: input.ingredientName,
      quantityRequired: input.quantityRequired,
      quantityConsumed,
      totalCost,
      batchConsumptions,
    };
  }

  private calculateBatchStatusAfterConsumption(
    quantityReceived: number,
    quantityAvailable: number,
  ): InventoryBatchStatus {
    if (quantityAvailable <= 0) {
      return 'DEPLETED';
    }

    if (quantityAvailable < quantityReceived) {
      return 'PARTIALLY_USED';
    }

    return 'AVAILABLE';
  }

  private createStockMovement(input: {
    restaurantId: string;
    recipeId: string;
    recipeName: string;
    saleId: string;
    quantitySold: number;
    unitMenuPrice: number;
    totalSalesRevenue: number;
    inventoryCostConsumed: number;
    estimatedGrossProfit: number;
    estimatedGrossMarginPercentage: number;
    inventoryBatchId: string;
    ingredientId: string;
    ingredientName: string;
    quantity: number;
    unit: StockMovement['unit'];
    unitCost: number;
    source: StockMovementSource;
    occurredAt: string;
    notes?: string;
  }): StockMovement {
    const audit = createAuditTimestamps();
    const totalCost = this.roundMoney(input.quantity * input.unitCost);

    const stockMovement: StockMovement = {
      id: this.createMovementId(input.restaurantId),
      restaurantId: input.restaurantId,
      inventoryBatchId: input.inventoryBatchId,
      ingredientId: input.ingredientId,
      ingredientName: input.ingredientName,
      recipeId: input.recipeId,
      recipeName: input.recipeName,
      saleId: input.saleId,
      quantitySold: input.quantitySold,
      unitMenuPrice: input.unitMenuPrice,
      totalSalesRevenue: input.totalSalesRevenue,
      inventoryCostConsumed: input.inventoryCostConsumed,
      estimatedGrossProfit: input.estimatedGrossProfit,
      estimatedGrossMarginPercentage:
        input.estimatedGrossMarginPercentage,
      movementType: 'CONSUMPTION',
      source: input.source,
      quantity: this.roundQuantity(input.quantity),
      unit: input.unit,
      unitCost: input.unitCost,
      totalCost,
      occurredAt: input.occurredAt,
      ...audit,
    };

    if (input.notes !== undefined) {
      stockMovement.notes = input.notes.trim();
    }

    return stockMovement;
  }

  private createStockConsumedEvent(input: {
    restaurantId: string;
    recipeId: string;
    recipeName: string;
    quantitySold: number;
    unitMenuPrice: number;
    totalSalesRevenue: number;
    inventoryCostConsumed: number;
    estimatedGrossProfit: number;
    estimatedGrossMarginPercentage: number;
    ingredients: RecipeSaleConsumptionResult['ingredients'];
    movements: StockMovement[];
  }): DomainEventEnvelope<StockConsumedEventPayload> {
    const payload: StockConsumedEventPayload = {
      recipeId: input.recipeId,
      recipeName: input.recipeName,
      quantitySold: input.quantitySold,
      unitMenuPrice: input.unitMenuPrice,
      totalSalesRevenue: input.totalSalesRevenue,
      inventoryCostConsumed: input.inventoryCostConsumed,
      estimatedGrossProfit: input.estimatedGrossProfit,
      estimatedGrossMarginPercentage: input.estimatedGrossMarginPercentage,
      ingredients: input.ingredients.map((ingredient) => ({
        ingredientId: ingredient.ingredientId,
        ingredientName: ingredient.ingredientName,
        quantityConsumed: ingredient.quantityConsumed,
        totalCost: ingredient.totalCost
      })),
      movements: input.movements.map((movement) => ({
        movementId: movement.id,
        inventoryBatchId: movement.inventoryBatchId,
        ingredientId: movement.ingredientId,
        quantity: movement.quantity,
        totalCost: movement.totalCost
      }))
    };

    return createDomainEventEnvelope({
      eventType: 'StockConsumed',
      aggregateId: input.recipeId,
      restaurantId: input.restaurantId,
      payload
    });
  }

  private buildMovementFilters(
    query: ListStockMovementsQueryDto,
  ): StockMovementListFilters {
    const filters: StockMovementListFilters = {};

    if (query.ingredientId) {
      filters.ingredientId = query.ingredientId;
    }

    if (query.inventoryBatchId) {
      filters.inventoryBatchId = query.inventoryBatchId;
    }

    if (query.recipeId) {
      filters.recipeId = query.recipeId;
    }

    if (query.movementType) {
      filters.movementType = query.movementType;
    }

    if (query.source) {
      filters.source = query.source;
    }

    return filters;
  }

  private createMovementId(restaurantId: string): string {
    const safeRestaurantId = restaurantId.replace(/[^a-zA-Z0-9_]/g, '_');

    return `movement_${safeRestaurantId}_${randomUUID()}`;
  }

  private createSaleId(restaurantId: string): string {
    const safeRestaurantId = restaurantId.replace(/[^a-zA-Z0-9_]/g, '_');

    return `sale_${safeRestaurantId}_${randomUUID()}`;
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
      ((input.estimatedGrossProfit / input.totalSalesRevenue) * 100).toFixed(2),
    );
  }

  private roundQuantity(value: number): number {
    return Number(value.toFixed(4));
  }

  private async invalidateDashboardCache(
    restaurantId: string
  ): Promise<void> {
    const cacheKey = `dashboard:summary:${restaurantId}`;

    await this.redisCacheService.delete(cacheKey);
  }
}
