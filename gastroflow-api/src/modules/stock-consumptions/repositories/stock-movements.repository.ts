import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Firestore } from 'firebase-admin/firestore';
import type { Query, Transaction } from 'firebase-admin/firestore';
import { FIRESTORE } from '../../../common/firestore/firestore.constants';
import type {
  StockMovement,
  StockMovementSource,
  StockMovementType,
} from '../models/stock-movement.model';

export interface StockMovementListFilters {
  ingredientId?: string;
  inventoryBatchId?: string;
  recipeId?: string;
  movementType?: StockMovementType;
  source?: StockMovementSource;
}

@Injectable()
export class StockMovementsRepository {
  private readonly stockMovementsCollection = 'stockMovements';

  constructor(
    @Inject(FIRESTORE)
    private readonly firestore: Firestore,
  ) { }

  async createStockMovement(
    stockMovement: StockMovement,
  ): Promise<StockMovement> {
    await this.firestore
      .collection(this.stockMovementsCollection)
      .doc(stockMovement.id)
      .set(stockMovement);

    return stockMovement;
  }

  async createStockMovements(
    stockMovements: StockMovement[],
  ): Promise<StockMovement[]> {
    const batch = this.firestore.batch();

    stockMovements.forEach((stockMovement) => {
      const ref = this.firestore
        .collection(this.stockMovementsCollection)
        .doc(stockMovement.id);

      batch.set(ref, stockMovement);
    });

    await batch.commit();

    return stockMovements;
  }

  async findStockMovementsByRestaurantId(
    restaurantId: string,
    filters: StockMovementListFilters = {},
  ): Promise<StockMovement[]> {
    let query: Query = this.firestore
      .collection(this.stockMovementsCollection)
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

    if (filters.recipeId) {
      query = query.where('recipeId', '==', filters.recipeId);
    }

    if (filters.movementType) {
      query = query.where('movementType', '==', filters.movementType);
    }

    if (filters.source) {
      query = query.where('source', '==', filters.source);
    }

    const snapshot = await query.get();

    return snapshot.docs.map((doc) => doc.data() as StockMovement);
  }

  async findStockMovementById(
    restaurantId: string,
    movementId: string,
  ): Promise<StockMovement> {
    const snapshot = await this.firestore
      .collection(this.stockMovementsCollection)
      .doc(movementId)
      .get();

    if (!snapshot.exists) {
      throw new NotFoundException(
        `Stock movement ${movementId} was not found.`,
      );
    }

    const stockMovement = snapshot.data() as StockMovement;

    if (stockMovement.restaurantId !== restaurantId) {
      throw new NotFoundException(
        `Stock movement ${movementId} was not found.`,
      );
    }

    return stockMovement;
  }

  createStockMovementsInTransaction(
    transaction: Transaction,
    stockMovements: StockMovement[],
  ): StockMovement[] {
    stockMovements.forEach((stockMovement) => {
      const ref = this.firestore
        .collection(this.stockMovementsCollection)
        .doc(stockMovement.id);

      transaction.set(ref, stockMovement);
    });

    return stockMovements;
  }
}