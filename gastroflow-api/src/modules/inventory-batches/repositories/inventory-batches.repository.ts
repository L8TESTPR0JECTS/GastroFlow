import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Firestore } from 'firebase-admin/firestore';
import type { Query, Transaction } from 'firebase-admin/firestore';
import { FIRESTORE } from '../../../common/firestore/firestore.constants';
import type {
  InventoryBatch,
  InventoryBatchStatus,
} from '../models/inventory-batch.model';

export interface InventoryBatchListFilters {
  ingredientId?: string;
  locationId?: string;
  status?: InventoryBatchStatus;
  isActive?: boolean;
}

@Injectable()
export class InventoryBatchesRepository {
  private readonly inventoryBatchesCollection = 'inventoryBatches';

  constructor(
    @Inject(FIRESTORE)
    private readonly firestore: Firestore,
  ) { }

  async createInventoryBatch(
    inventoryBatch: InventoryBatch,
  ): Promise<InventoryBatch> {
    await this.firestore
      .collection(this.inventoryBatchesCollection)
      .doc(inventoryBatch.id)
      .set(inventoryBatch);

    return inventoryBatch;
  }

  async upsertInventoryBatch(
    inventoryBatch: InventoryBatch,
  ): Promise<InventoryBatch> {
    await this.firestore
      .collection(this.inventoryBatchesCollection)
      .doc(inventoryBatch.id)
      .set(inventoryBatch, { merge: true });

    return inventoryBatch;
  }

  async findInventoryBatchesByRestaurantId(
    restaurantId: string,
    filters: InventoryBatchListFilters = {},
  ): Promise<InventoryBatch[]> {
    let query: Query = this.firestore
      .collection(this.inventoryBatchesCollection)
      .where('restaurantId', '==', restaurantId);

    if (filters.ingredientId) {
      query = query.where('ingredientId', '==', filters.ingredientId);
    }

    if (filters.locationId) {
      query = query.where('locationId', '==', filters.locationId);
    }

    if (filters.status) {
      query = query.where('status', '==', filters.status);
    }

    if (typeof filters.isActive === 'boolean') {
      query = query.where('isActive', '==', filters.isActive);
    }

    const snapshot = await query.get();

    return snapshot.docs.map((doc) => doc.data() as InventoryBatch);
  }

  async findInventoryBatchById(
    restaurantId: string,
    batchId: string,
  ): Promise<InventoryBatch> {
    const snapshot = await this.firestore
      .collection(this.inventoryBatchesCollection)
      .doc(batchId)
      .get();

    if (!snapshot.exists) {
      throw new NotFoundException(`Inventory batch ${batchId} was not found.`);
    }

    const inventoryBatch = snapshot.data() as InventoryBatch;

    if (inventoryBatch.restaurantId !== restaurantId) {
      throw new NotFoundException(`Inventory batch ${batchId} was not found.`);
    }

    return inventoryBatch;
  }

  async updateInventoryBatch(
    restaurantId: string,
    batchId: string,
    changes: Partial<InventoryBatch>,
  ): Promise<InventoryBatch> {
    await this.findInventoryBatchById(restaurantId, batchId);

    const ref = this.firestore
      .collection(this.inventoryBatchesCollection)
      .doc(batchId);

    await ref.update(changes);

    const updatedSnapshot = await ref.get();

    return updatedSnapshot.data() as InventoryBatch;
  }

  async softDeleteInventoryBatch(
    restaurantId: string,
    batchId: string,
    updatedAt: string,
  ): Promise<InventoryBatch> {
    return this.updateInventoryBatch(restaurantId, batchId, {
      isActive: false,
      updatedAt,
    });
  }

  async findAvailableInventoryBatchesForIngredient(
    restaurantId: string,
    ingredientId: string,
  ): Promise<InventoryBatch[]> {
    const snapshot = await this.firestore
      .collection(this.inventoryBatchesCollection)
      .where('restaurantId', '==', restaurantId)
      .where('ingredientId', '==', ingredientId)
      .where('isActive', '==', true)
      .where('status', 'in', ['AVAILABLE', 'PARTIALLY_USED'])
      .get();

    return snapshot.docs.map((doc) => doc.data() as InventoryBatch);
  }

  async updateInventoryBatchQuantityAndStatus(
    restaurantId: string,
    batchId: string,
    changes: Pick<
      InventoryBatch,
      'quantityAvailable' | 'status' | 'updatedAt'
    >,
  ): Promise<InventoryBatch> {
    await this.findInventoryBatchById(restaurantId, batchId);

    const ref = this.firestore
      .collection(this.inventoryBatchesCollection)
      .doc(batchId);

    await ref.update(changes);

    const updatedSnapshot = await ref.get();

    return updatedSnapshot.data() as InventoryBatch;
  }

  async findAvailableInventoryBatchesForIngredientInTransaction(
    transaction: Transaction,
    restaurantId: string,
    ingredientId: string,
  ): Promise<InventoryBatch[]> {
    const query = this.firestore
      .collection(this.inventoryBatchesCollection)
      .where('restaurantId', '==', restaurantId)
      .where('ingredientId', '==', ingredientId)
      .where('isActive', '==', true)
      .where('status', 'in', ['AVAILABLE', 'PARTIALLY_USED']);

    const snapshot = await transaction.get(query);

    return snapshot.docs.map((doc) => doc.data() as InventoryBatch);
  }

  updateInventoryBatchQuantityAndStatusInTransaction(
    transaction: Transaction,
    batchId: string,
    changes: Pick<
      InventoryBatch,
      'quantityAvailable' | 'status' | 'updatedAt'
    >,
  ): void {
    const ref = this.firestore
      .collection(this.inventoryBatchesCollection)
      .doc(batchId);

    transaction.update(ref, changes);
  }
}