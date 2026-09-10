import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { createAuditTimestamps } from '../../common/utils/audit.util';
import { addDaysIso, nowIso } from '../../common/utils/date.util';
import { IngredientsService } from '../ingredients/ingredients.service';
import { RestaurantsService } from '../restaurants/restaurants.service';
import { DEMO_INVENTORY_BATCHES } from './data/demo-inventory-batches.data';
import { CreateInventoryBatchDto } from './dto/create-inventory-batch.dto';
import { ListInventoryBatchesQueryDto } from './dto/list-inventory-batches-query.dto';
import { UpdateInventoryBatchDto } from './dto/update-inventory-batch.dto';
import type {
  InventoryBatch,
  InventoryBatchStatus,
} from './models/inventory-batch.model';
import {
  InventoryBatchListFilters,
  InventoryBatchesRepository,
} from './repositories/inventory-batches.repository';

@Injectable()
export class InventoryBatchesService {
  constructor(
    private readonly inventoryBatchesRepository: InventoryBatchesRepository,
    private readonly restaurantsService: RestaurantsService,
    private readonly ingredientsService: IngredientsService,
  ) {}

  async createInventoryBatch(
    restaurantId: string,
    dto: CreateInventoryBatchDto,
  ): Promise<InventoryBatch> {
    await this.restaurantsService.getRestaurantById(restaurantId);

    const ingredient = await this.ingredientsService.getIngredientById(
      restaurantId,
      dto.ingredientId,
    );

    await this.restaurantsService.getLocationById(
      restaurantId,
      dto.locationId,
    );

    const receivedAt = dto.receivedAt ?? nowIso();
    const expiresAt =
      dto.expiresAt ?? addDaysIso(receivedAt, ingredient.averageShelfLifeDays);

    const totalCost = this.calculateTotalCost(
      dto.quantityReceived,
      dto.unitCost,
    );

    const audit = createAuditTimestamps();

    const inventoryBatch: InventoryBatch = {
      id: this.createRandomBatchId(restaurantId),
      restaurantId,
      ingredientId: ingredient.id,
      ingredientName: ingredient.name,
      locationId: dto.locationId,
      quantityReceived: dto.quantityReceived,
      quantityAvailable: dto.quantityReceived,
      unit: ingredient.baseUnit,
      unitCost: dto.unitCost,
      totalCost,
      receivedAt,
      expiresAt,
      status: 'AVAILABLE',
      isActive: true,
      notes: dto.notes?.trim(),
      ...audit,
    };

    return this.inventoryBatchesRepository.createInventoryBatch(
      inventoryBatch,
    );
  }

  async listInventoryBatches(
    restaurantId: string,
    query: ListInventoryBatchesQueryDto,
  ): Promise<InventoryBatch[]> {
    await this.restaurantsService.getRestaurantById(restaurantId);

    const filters = this.buildListFilters(query);

    return this.inventoryBatchesRepository.findInventoryBatchesByRestaurantId(
      restaurantId,
      filters,
    );
  }

  async getInventoryBatchById(
    restaurantId: string,
    batchId: string,
  ): Promise<InventoryBatch> {
    return this.inventoryBatchesRepository.findInventoryBatchById(
      restaurantId,
      batchId,
    );
  }

  async updateInventoryBatch(
    restaurantId: string,
    batchId: string,
    dto: UpdateInventoryBatchDto,
  ): Promise<InventoryBatch> {
    await this.restaurantsService.getRestaurantById(restaurantId);

    const currentBatch =
      await this.inventoryBatchesRepository.findInventoryBatchById(
        restaurantId,
        batchId,
      );

    const changes: Partial<InventoryBatch> = {
      updatedAt: nowIso(),
    };

    if (dto.quantityAvailable !== undefined) {
      if (dto.quantityAvailable > currentBatch.quantityReceived) {
        throw new BadRequestException(
          'quantityAvailable cannot be greater than quantityReceived.',
        );
      }

      changes.quantityAvailable = dto.quantityAvailable;
      changes.status = this.calculateStatusFromQuantity(
        currentBatch.quantityReceived,
        dto.quantityAvailable,
      );
    }

    if (dto.unitCost !== undefined) {
      changes.unitCost = dto.unitCost;
      changes.totalCost = this.calculateTotalCost(
        currentBatch.quantityReceived,
        dto.unitCost,
      );
    }

    if (dto.receivedAt !== undefined) {
      changes.receivedAt = dto.receivedAt;
    }

    if (dto.expiresAt !== undefined) {
      changes.expiresAt = dto.expiresAt;
    }

    if (dto.status !== undefined) {
      changes.status = dto.status;
    }

    if (dto.isActive !== undefined) {
      changes.isActive = dto.isActive;
    }

    if (dto.notes !== undefined) {
      changes.notes = dto.notes.trim();
    }

    return this.inventoryBatchesRepository.updateInventoryBatch(
      restaurantId,
      batchId,
      changes,
    );
  }

  async softDeleteInventoryBatch(
    restaurantId: string,
    batchId: string,
  ): Promise<InventoryBatch> {
    await this.restaurantsService.getRestaurantById(restaurantId);

    return this.inventoryBatchesRepository.softDeleteInventoryBatch(
      restaurantId,
      batchId,
      nowIso(),
    );
  }

  async seedDemoInventoryBatches(restaurantId: string): Promise<{
    restaurantId: string;
    inventoryBatchesCreated: number;
    inventoryBatches: InventoryBatch[];
  }> {
    await this.restaurantsService.getRestaurantById(restaurantId);

    const audit = createAuditTimestamps();
    const receivedAt = nowIso();

    const inventoryBatches = await Promise.all(
      DEMO_INVENTORY_BATCHES.map(async (seedBatch) => {
        const ingredientId = this.createIngredientIdFromNameKey(
          restaurantId,
          seedBatch.ingredientNameKey,
        );

        const ingredient = await this.ingredientsService.getIngredientById(
          restaurantId,
          ingredientId,
        );

        await this.restaurantsService.getLocationById(
          restaurantId,
          seedBatch.locationId,
        );

        const expiresAt = addDaysIso(receivedAt, seedBatch.shelfLifeDays);

        const inventoryBatch: InventoryBatch = {
          id: this.createDemoBatchId(
            restaurantId,
            seedBatch.ingredientNameKey,
          ),
          restaurantId,
          ingredientId: ingredient.id,
          ingredientName: ingredient.name,
          locationId: seedBatch.locationId,
          quantityReceived: seedBatch.quantityReceived,
          quantityAvailable: seedBatch.quantityReceived,
          unit: ingredient.baseUnit,
          unitCost: seedBatch.unitCost,
          totalCost: this.calculateTotalCost(
            seedBatch.quantityReceived,
            seedBatch.unitCost,
          ),
          receivedAt,
          expiresAt,
          status: 'AVAILABLE',
          isActive: true,
          notes: seedBatch.notes,
          ...audit,
        };

        return inventoryBatch;
      }),
    );

    const savedInventoryBatches = await Promise.all(
      inventoryBatches.map((inventoryBatch) =>
        this.inventoryBatchesRepository.upsertInventoryBatch(inventoryBatch),
      ),
    );

    return {
      restaurantId,
      inventoryBatchesCreated: savedInventoryBatches.length,
      inventoryBatches: savedInventoryBatches,
    };
  }

  private buildListFilters(
    query: ListInventoryBatchesQueryDto,
  ): InventoryBatchListFilters {
    const filters: InventoryBatchListFilters = {};

    if (query.ingredientId) {
      filters.ingredientId = query.ingredientId;
    }

    if (query.locationId) {
      filters.locationId = query.locationId;
    }

    if (query.status) {
      filters.status = query.status;
    }

    if (query.isActive === undefined) {
      filters.isActive = true;
    } else {
      filters.isActive = query.isActive === 'true';
    }

    return filters;
  }

  private calculateTotalCost(
    quantityReceived: number,
    unitCost: number,
  ): number {
    return Number((quantityReceived * unitCost).toFixed(4));
  }

  private calculateStatusFromQuantity(
    quantityReceived: number,
    quantityAvailable: number,
  ): InventoryBatchStatus {
    if (quantityAvailable === 0) {
      return 'DEPLETED';
    }

    if (quantityAvailable < quantityReceived) {
      return 'PARTIALLY_USED';
    }

    return 'AVAILABLE';
  }

  private createRandomBatchId(restaurantId: string): string {
    const safeRestaurantId = restaurantId.replace(/[^a-zA-Z0-9_]/g, '_');

    return `batch_${safeRestaurantId}_${randomUUID()}`;
  }

  private createDemoBatchId(
    restaurantId: string,
    ingredientNameKey: string,
  ): string {
    const safeRestaurantId = restaurantId.replace(/[^a-zA-Z0-9_]/g, '_');
    const safeIngredientNameKey = ingredientNameKey.replace(/-/g, '_');

    return `batch_${safeRestaurantId}_${safeIngredientNameKey}_demo_001`;
  }

  private createIngredientIdFromNameKey(
    restaurantId: string,
    ingredientNameKey: string,
  ): string {
    const safeRestaurantId = restaurantId.replace(/[^a-zA-Z0-9_]/g, '_');
    const safeIngredientNameKey = ingredientNameKey.replace(/-/g, '_');

    return `ingredient_${safeRestaurantId}_${safeIngredientNameKey}`;
  }
}