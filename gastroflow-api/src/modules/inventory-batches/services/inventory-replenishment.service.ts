import { Injectable } from '@nestjs/common';

import { IngredientsService } from '../../ingredients/ingredients.service';
import { InventoryBatchesRepository } from '../repositories/inventory-batches.repository';
import { ReplenishmentPolicyService } from './replenishment-policy.service';
import { ReplenishmentReportPublisher } from 'src/common/rabbitmq/replenishment-report.publisher';

@Injectable()
export class InventoryReplenishmentService {
    constructor(
        private readonly ingredientsService: IngredientsService,
        private readonly inventoryBatchesRepository: InventoryBatchesRepository,
        private readonly replenishmentPolicyService: ReplenishmentPolicyService,
        private readonly replenishmentReportPublisher: ReplenishmentReportPublisher
    ) { }

    async getReplenishmentSuggestions(
        restaurantId: string
    ): Promise<Array<{
        ingredientId: string;
        ingredientName: string;
        availableQuantity: number;
        targetStockQuantity: number;
        suggestedOrderQuantity: number;
    }>> {
        const [ingredients, inventoryBatches] = await Promise.all([
            this.ingredientsService.listIngredients(restaurantId, {}),
            this.inventoryBatchesRepository.findInventoryBatchesByRestaurantId(
                restaurantId,
                { isActive: true }
            )
        ]);

        return ingredients
            .map((ingredient) => {
                const availableQuantity = inventoryBatches
                    .filter((batch) => {
                        return batch.ingredientId === ingredient.id;
                    })
                    .reduce((total, batch) => {
                        return total + batch.quantityAvailable;
                    }, 0);

                const result = this.replenishmentPolicyService.calculate({
                    availableQuantity,
                    lowStockThresholdQuantity: ingredient.lowStockThresholdQuantity,
                    targetStockQuantity: ingredient.targetStockQuantity
                });

                if (!result.shouldReplenish) {
                    return null;
                }

                return {
                    ingredientId: ingredient.id,
                    ingredientName: ingredient.name,
                    availableQuantity,
                    targetStockQuantity: ingredient.targetStockQuantity,
                    suggestedOrderQuantity: result.suggestedOrderQuantity
                };
            })
            .filter((suggestion) => suggestion !== null);
    }

    async requestReplenishmentReport(restaurantId: string) {
        this.replenishmentReportPublisher.publish({
            restaurantId,
            requestedAt: new Date().toISOString()
        });

        return {
            restaurantId,
            queued: true
        };
    }

}