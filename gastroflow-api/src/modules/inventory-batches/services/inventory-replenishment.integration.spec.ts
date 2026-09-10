import { Test } from '@nestjs/testing';

import { FirestoreModule } from '../../../common/firestore/firestore.module';
import { IngredientsModule } from '../../ingredients/ingredients.module';
import { InventoryBatchesModule } from '../inventory-batches.module';
import { InventoryReplenishmentService } from './inventory-replenishment.service';
import { ConfigModule } from '@nestjs/config';
import { Firestore } from 'firebase-admin/firestore';
import { FIRESTORE } from 'src/common/firestore/firestore.constants';

describe('InventoryReplenishmentService integration', () => {
    let service: InventoryReplenishmentService;
    let firestore: Firestore;

    const restaurantId = 'rest_replenishment_integration';
    const ingredientId = 'ingredient_replenishment_steak';

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

        service = module.get(InventoryReplenishmentService);
        firestore = module.get(FIRESTORE);

    });

    beforeEach(async () => {
        await firestore
            .collection('restaurants')
            .doc(restaurantId)
            .set({
                id: restaurantId,
                name: 'Integration Test Restaurant'
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
                description: 'Integration test ingredient',
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });

        await firestore
            .collection('inventoryBatches')
            .doc('batch_replenishment_001')
            .set({
                id: 'batch_replenishment_001',
                restaurantId,
                ingredientId,
                quantityAvailable: 500,
                isActive: true
            });

        await firestore
            .collection('inventoryBatches')
            .doc('batch_replenishment_002')
            .set({
                id: 'batch_replenishment_002',
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
                .doc('batch_replenishment_001')
                .delete(),

            firestore
                .collection('inventoryBatches')
                .doc('batch_replenishment_002')
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

    it('calculates replenishment using real Firestore data', async () => {
        const result =
            await service.getReplenishmentSuggestions(restaurantId);

        expect(result).toEqual([
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