import type { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import type { Firestore } from 'firebase-admin/firestore';
import request from 'supertest';

import { FIRESTORE } from '../../common/firestore/firestore.constants';
import { FirestoreModule } from '../../common/firestore/firestore.module';
import { IngredientsModule } from '../ingredients/ingredients.module';
import { InventoryBatchesModule } from './inventory-batches.module';

describe('Inventory replenishment E2E', () => {
  let app: INestApplication;
  let firestore: Firestore;

  const restaurantId = 'rest_replenishment_e2e';
  const ingredientId = 'ingredient_replenishment_e2e_steak';

  beforeAll(async () => {
    process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:9090';
    process.env.GCP_PROJECT_ID = 'gastroflow-test';

    const module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true
        }),
        FirestoreModule,
        IngredientsModule,
        InventoryBatchesModule
      ]
    }).compile();

    app = module.createNestApplication();

    await app.init();

    firestore = module.get(FIRESTORE);
  });

  beforeEach(async () => {
    const now = new Date().toISOString();

    await firestore
      .collection('restaurants')
      .doc(restaurantId)
      .set({
        id: restaurantId,
        name: 'E2E Test Restaurant'
      });

    await firestore
      .collection('ingredients')
      .doc(ingredientId)
      .set({
        id: ingredientId,
        restaurantId,
        name: 'Steak',
        nameKey: 'steak',
        category: 'PROTEIN',
        baseUnit: 'GRAM',
        storageType: 'REFRIGERATED',
        averageShelfLifeDays: 5,
        defaultCostPerUnit: 0.018,
        wasteRiskLevel: 'MEDIUM',
        recipeCoverageScore: 4,
        stockRotationStrategy: 'FEFO',
        lowStockThresholdQuantity: 2000,
        targetStockQuantity: 10000,
        iconKey: 'steak',
        description: 'E2E test ingredient',
        isActive: true,
        createdAt: now,
        updatedAt: now
      });

    await firestore
      .collection('inventoryBatches')
      .doc('batch_replenishment_e2e_001')
      .set({
        id: 'batch_replenishment_e2e_001',
        restaurantId,
        ingredientId,
        quantityAvailable: 500,
        isActive: true
      });

    await firestore
      .collection('inventoryBatches')
      .doc('batch_replenishment_e2e_002')
      .set({
        id: 'batch_replenishment_e2e_002',
        restaurantId,
        ingredientId,
        quantityAvailable: 700,
        isActive: true
      });
  });

  afterEach(async () => {
    await Promise.all([
      firestore
        .collection('inventoryBatches')
        .doc('batch_replenishment_e2e_001')
        .delete(),

      firestore
        .collection('inventoryBatches')
        .doc('batch_replenishment_e2e_002')
        .delete(),

      firestore
        .collection('ingredients')
        .doc(ingredientId)
        .delete(),

      firestore
        .collection('restaurants')
        .doc(restaurantId)
        .delete()
    ]);
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns replenishment suggestions through HTTP', async () => {
    const response = await request(app.getHttpServer())
      .get(
        `/restaurants/${restaurantId}/inventory/replenishment/suggestions`
      )
      .expect(200);

    expect(response.body).toEqual([
      {
        ingredientId,
        ingredientName: 'Steak',
        availableQuantity: 1200,
        targetStockQuantity: 10000,
        suggestedOrderQuantity: 8800
      }
    ]);
  });
});