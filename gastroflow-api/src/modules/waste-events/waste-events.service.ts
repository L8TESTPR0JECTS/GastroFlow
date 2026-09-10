import {
  BadRequestException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Firestore } from 'firebase-admin/firestore';
import { FIRESTORE } from '../../common/firestore/firestore.constants';
import { createAuditTimestamps } from '../../common/utils/audit.util';
import { nowIso } from '../../common/utils/date.util';
import {
  DOMAIN_EVENTS_PUBLISHER,
} from '../../common/events/domain-events-publisher';
import type { DomainEventsPublisher } from '../../common/events/domain-events-publisher';
import type { StockMovement } from '../stock-consumptions/models/stock-movement.model';
import type {
  InventoryBatch,
  InventoryBatchStatus,
} from '../inventory-batches/models/inventory-batch.model';
import { InventoryBatchesRepository } from '../inventory-batches/repositories/inventory-batches.repository';
import { RestaurantsService } from '../restaurants/restaurants.service';
import { CreateWasteEventDto } from './dto/create-waste-event.dto';
import { ListWasteEventsQueryDto } from './dto/list-waste-events-query.dto';
import type { WasteEventResult } from './models/waste-event-result.model';
import type {
  WasteEvent,
} from './models/waste-event.model';
import type {
  WasteEventListFilters,
} from './repositories/waste-events.repository';
import { WasteEventsRepository } from './repositories/waste-events.repository';

import { createDomainEventEnvelope } from '../../common/events/domain-event-envelope.factory';
import type { DomainEventEnvelope } from '../../common/events/domain-event-envelope';
import type { WasteRecordedEventPayload } from './events/waste-recorded.event';

interface WasteTransactionResult {
  wasteEvent: WasteEvent;
  stockMovement: StockMovement;
  remainingQuantityAvailable: number;
  inventoryBatchStatus: InventoryBatchStatus;
}

@Injectable()
export class WasteEventsService {
  private readonly inventoryBatchesCollection = 'inventoryBatches';
  private readonly stockMovementsCollection = 'stockMovements';
  private readonly wasteEventsCollection = 'wasteEvents';

  constructor(
    @Inject(FIRESTORE)
    private readonly firestore: Firestore,
    private readonly restaurantsService: RestaurantsService,
    private readonly inventoryBatchesRepository: InventoryBatchesRepository,
    private readonly wasteEventsRepository: WasteEventsRepository,
    @Inject(DOMAIN_EVENTS_PUBLISHER)
    private readonly domainEventsPublisher: DomainEventsPublisher,
  ) {}

  async createWasteEvent(
    restaurantId: string,
    dto: CreateWasteEventDto,
  ): Promise<WasteEventResult> {
    await this.restaurantsService.getRestaurantById(restaurantId);

    const occurredAt = nowIso();

    const transactionResult = await this.firestore.runTransaction(
      async (transaction): Promise<WasteTransactionResult> => {
        const batchRef = this.firestore
          .collection(this.inventoryBatchesCollection)
          .doc(dto.inventoryBatchId);

        const batchSnapshot = await transaction.get(batchRef);

        if (!batchSnapshot.exists) {
          throw new BadRequestException(
            `Inventory batch ${dto.inventoryBatchId} was not found.`,
          );
        }

        const inventoryBatch = batchSnapshot.data() as InventoryBatch;

        this.validateInventoryBatchForWaste({
          restaurantId,
          inventoryBatch,
          quantityWasted: dto.quantityWasted,
        });

        const remainingQuantityAvailable = this.roundQuantity(
          inventoryBatch.quantityAvailable - dto.quantityWasted,
        );

        const nextStatus = this.calculateBatchStatusAfterWaste(
          inventoryBatch.quantityReceived,
          remainingQuantityAvailable,
        );

        const stockMovementId = this.createStockMovementId(restaurantId);
        const wasteEventId = this.createWasteEventId(restaurantId);

        const stockMovement = this.createWasteStockMovement({
          id: stockMovementId,
          restaurantId,
          inventoryBatch,
          quantityWasted: dto.quantityWasted,
          occurredAt,
          notes: dto.notes,
        });

        const wasteEvent = this.createWasteEventModel({
          id: wasteEventId,
          restaurantId,
          inventoryBatch,
          quantityWasted: dto.quantityWasted,
          reason: dto.reason,
          stockMovementId,
          occurredAt,
          notes: dto.notes,
        });

        const stockMovementRef = this.firestore
          .collection(this.stockMovementsCollection)
          .doc(stockMovementId);

        const wasteEventRef = this.firestore
          .collection(this.wasteEventsCollection)
          .doc(wasteEventId);

        transaction.update(batchRef, {
          quantityAvailable: remainingQuantityAvailable,
          status: nextStatus,
          updatedAt: occurredAt,
        });

        transaction.set(stockMovementRef, stockMovement);
        transaction.set(wasteEventRef, wasteEvent);

        return {
          wasteEvent,
          stockMovement,
          remainingQuantityAvailable,
          inventoryBatchStatus: nextStatus,
        };
      },
    );

    const event = this.createWasteRecordedEvent({
      restaurantId,
      wasteEventId: transactionResult.wasteEvent.id,
      stockMovementId: transactionResult.stockMovement.id,
      inventoryBatchId: transactionResult.wasteEvent.inventoryBatchId,
      ingredientId: transactionResult.wasteEvent.ingredientId,
      ingredientName: transactionResult.wasteEvent.ingredientName,
      quantityWasted: transactionResult.wasteEvent.quantityWasted,
      totalCost: transactionResult.wasteEvent.totalCost,
      reason: transactionResult.wasteEvent.reason,
    });

    await this.domainEventsPublisher.publish(event);

    return {
      restaurantId,
      wasteEvent: transactionResult.wasteEvent,
      stockMovement: transactionResult.stockMovement,
      remainingQuantityAvailable:
        transactionResult.remainingQuantityAvailable,
      inventoryBatchStatus: transactionResult.inventoryBatchStatus,
    };
  }

  async listWasteEvents(
    restaurantId: string,
    query: ListWasteEventsQueryDto,
  ): Promise<WasteEvent[]> {
    await this.restaurantsService.getRestaurantById(restaurantId);

    const filters = this.buildWasteEventFilters(query);

    return this.wasteEventsRepository.findWasteEventsByRestaurantId(
      restaurantId,
      filters,
    );
  }

  async getWasteEventById(
    restaurantId: string,
    wasteEventId: string,
  ): Promise<WasteEvent> {
    await this.restaurantsService.getRestaurantById(restaurantId);

    return this.wasteEventsRepository.findWasteEventById(
      restaurantId,
      wasteEventId,
    );
  }

  private validateInventoryBatchForWaste(input: {
    restaurantId: string;
    inventoryBatch: InventoryBatch;
    quantityWasted: number;
  }): void {
    if (input.inventoryBatch.restaurantId !== input.restaurantId) {
      throw new BadRequestException(
        `Inventory batch ${input.inventoryBatch.id} was not found.`,
      );
    }

    if (!input.inventoryBatch.isActive) {
      throw new BadRequestException(
        `Inventory batch ${input.inventoryBatch.id} is inactive.`,
      );
    }

    if (
      input.inventoryBatch.status === 'DEPLETED' ||
      input.inventoryBatch.status === 'WASTED'
    ) {
      throw new BadRequestException(
        `Inventory batch ${input.inventoryBatch.id} cannot be wasted because its status is ${input.inventoryBatch.status}.`,
      );
    }

    if (input.inventoryBatch.quantityAvailable <= 0) {
      throw new BadRequestException(
        `Inventory batch ${input.inventoryBatch.id} has no available quantity.`,
      );
    }

    if (input.quantityWasted > input.inventoryBatch.quantityAvailable) {
      throw new BadRequestException(
        `Cannot waste ${input.quantityWasted} from batch ${input.inventoryBatch.id}. Only ${input.inventoryBatch.quantityAvailable} is available.`,
      );
    }
  }

  private calculateBatchStatusAfterWaste(
    quantityReceived: number,
    quantityAvailable: number,
  ): InventoryBatchStatus {
    if (quantityAvailable <= 0) {
      return 'WASTED';
    }

    if (quantityAvailable < quantityReceived) {
      return 'PARTIALLY_USED';
    }

    return 'AVAILABLE';
  }

  private createWasteStockMovement(input: {
    id: string;
    restaurantId: string;
    inventoryBatch: InventoryBatch;
    quantityWasted: number;
    occurredAt: string;
    notes?: string;
  }): StockMovement {
    const audit = createAuditTimestamps();
    const totalCost = this.roundMoney(
      input.quantityWasted * input.inventoryBatch.unitCost,
    );

    const stockMovement: StockMovement = {
      id: input.id,
      restaurantId: input.restaurantId,
      inventoryBatchId: input.inventoryBatch.id,
      ingredientId: input.inventoryBatch.ingredientId,
      ingredientName: input.inventoryBatch.ingredientName,
      movementType: 'WASTE',
      source: 'MANUAL',
      quantity: this.roundQuantity(input.quantityWasted),
      unit: input.inventoryBatch.unit,
      unitCost: input.inventoryBatch.unitCost,
      totalCost,
      occurredAt: input.occurredAt,
      ...audit,
    };

    if (input.notes !== undefined) {
      stockMovement.notes = input.notes.trim();
    }

    return stockMovement;
  }

  private createWasteEventModel(input: {
    id: string;
    restaurantId: string;
    inventoryBatch: InventoryBatch;
    quantityWasted: number;
    reason: WasteEvent['reason'];
    stockMovementId: string;
    occurredAt: string;
    notes?: string;
  }): WasteEvent {
    const audit = createAuditTimestamps();
    const totalCost = this.roundMoney(
      input.quantityWasted * input.inventoryBatch.unitCost,
    );

    const wasteEvent: WasteEvent = {
      id: input.id,
      restaurantId: input.restaurantId,
      inventoryBatchId: input.inventoryBatch.id,
      ingredientId: input.inventoryBatch.ingredientId,
      ingredientName: input.inventoryBatch.ingredientName,
      quantityWasted: this.roundQuantity(input.quantityWasted),
      unit: input.inventoryBatch.unit,
      unitCost: input.inventoryBatch.unitCost,
      totalCost,
      reason: input.reason,
      occurredAt: input.occurredAt,
      stockMovementId: input.stockMovementId,
      ...audit,
    };

    if (input.notes !== undefined) {
      wasteEvent.notes = input.notes.trim();
    }

    return wasteEvent;
  }

private createWasteRecordedEvent(input: {
  restaurantId: string;
  wasteEventId: string;
  stockMovementId: string;
  inventoryBatchId: string;
  ingredientId: string;
  ingredientName: string;
  quantityWasted: number;
  totalCost: number;
  reason: WasteRecordedEventPayload['reason'];
}): DomainEventEnvelope<WasteRecordedEventPayload> {
  const payload: WasteRecordedEventPayload = {
    wasteEventId: input.wasteEventId,
    stockMovementId: input.stockMovementId,
    inventoryBatchId: input.inventoryBatchId,
    ingredientId: input.ingredientId,
    ingredientName: input.ingredientName,
    quantityWasted: input.quantityWasted,
    totalCost: input.totalCost,
    reason: input.reason
  };

  return createDomainEventEnvelope({
    eventType: 'WasteRecorded',
    aggregateId: input.wasteEventId,
    restaurantId: input.restaurantId,
    payload
  });
}

  private buildWasteEventFilters(
    query: ListWasteEventsQueryDto,
  ): WasteEventListFilters {
    const filters: WasteEventListFilters = {};

    if (query.ingredientId) {
      filters.ingredientId = query.ingredientId;
    }

    if (query.inventoryBatchId) {
      filters.inventoryBatchId = query.inventoryBatchId;
    }

    if (query.reason) {
      filters.reason = query.reason;
    }

    return filters;
  }

  private createWasteEventId(restaurantId: string): string {
    const safeRestaurantId = restaurantId.replace(/[^a-zA-Z0-9_]/g, '_');

    return `waste_${safeRestaurantId}_${randomUUID()}`;
  }

  private createStockMovementId(restaurantId: string): string {
    const safeRestaurantId = restaurantId.replace(/[^a-zA-Z0-9_]/g, '_');

    return `movement_${safeRestaurantId}_${randomUUID()}`;
  }

  private roundMoney(value: number): number {
    return Number(value.toFixed(4));
  }

  private roundQuantity(value: number): number {
    return Number(value.toFixed(4));
  }
}