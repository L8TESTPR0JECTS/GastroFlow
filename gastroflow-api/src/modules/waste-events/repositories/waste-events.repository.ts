import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Firestore } from 'firebase-admin/firestore';
import type { Query } from 'firebase-admin/firestore';
import { FIRESTORE } from '../../../common/firestore/firestore.constants';
import type {
  WasteEvent,
  WasteReason,
} from '../models/waste-event.model';

export interface WasteEventListFilters {
  ingredientId?: string;
  inventoryBatchId?: string;
  reason?: WasteReason;
}

@Injectable()
export class WasteEventsRepository {
  private readonly wasteEventsCollection = 'wasteEvents';

  constructor(
    @Inject(FIRESTORE)
    private readonly firestore: Firestore,
  ) {}

  async createWasteEvent(wasteEvent: WasteEvent): Promise<WasteEvent> {
    await this.firestore
      .collection(this.wasteEventsCollection)
      .doc(wasteEvent.id)
      .set(wasteEvent);

    return wasteEvent;
  }

  async findWasteEventsByRestaurantId(
    restaurantId: string,
    filters: WasteEventListFilters = {},
  ): Promise<WasteEvent[]> {
    let query: Query = this.firestore
      .collection(this.wasteEventsCollection)
      .where('restaurantId', '==', restaurantId);

    if (filters.ingredientId) {
      query = query.where('ingredientId', '==', filters.ingredientId);
    }

    if (filters.inventoryBatchId) {
      query = query.where(
        'inventoryBatchId',
        '==',
        filters.inventoryBatchId,
      );
    }

    if (filters.reason) {
      query = query.where('reason', '==', filters.reason);
    }

    const snapshot = await query.get();

    return snapshot.docs.map((doc) => doc.data() as WasteEvent);
  }

  async findWasteEventById(
    restaurantId: string,
    wasteEventId: string,
  ): Promise<WasteEvent> {
    const snapshot = await this.firestore
      .collection(this.wasteEventsCollection)
      .doc(wasteEventId)
      .get();

    if (!snapshot.exists) {
      throw new NotFoundException(
        `Waste event ${wasteEventId} was not found.`,
      );
    }

    const wasteEvent = snapshot.data() as WasteEvent;

    if (wasteEvent.restaurantId !== restaurantId) {
      throw new NotFoundException(
        `Waste event ${wasteEventId} was not found.`,
      );
    }

    return wasteEvent;
  }
}