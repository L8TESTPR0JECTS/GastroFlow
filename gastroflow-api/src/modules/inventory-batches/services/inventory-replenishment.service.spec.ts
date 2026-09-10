import { Test } from "@nestjs/testing";

jest.mock('../../ingredients/ingredients.service', () => ({
    IngredientsService: class IngredientsService { }
}));

import { IngredientsService } from "../../ingredients/ingredients.service";
import { InventoryReplenishmentService } from "./inventory-replenishment.service"
import { ReplenishmentPolicyService } from "./replenishment-policy.service";
import { InventoryBatchesRepository } from "../repositories/inventory-batches.repository";
import { ReplenishmentReportPublisher } from "src/common/rabbitmq/replenishment-report.publisher";

describe("InventoryReplenishmentService", () => {

    let service: InventoryReplenishmentService;

    const ingredientsService = { listIngredients: jest.fn() };
    const replenishmentReportPublisher = {publish: jest.fn()};

    const inventoryBatchesRepository = { findInventoryBatchesByRestaurantId: jest.fn() };
    beforeEach(async () => {
        const module = await Test.createTestingModule({
            providers: [
                InventoryReplenishmentService,
                ReplenishmentPolicyService,
                {
                    provide: IngredientsService,
                    useValue: ingredientsService
                },
                {
                    provide: InventoryBatchesRepository,
                    useValue: inventoryBatchesRepository
                },
                {
                    provide: ReplenishmentReportPublisher,
                    useValue: replenishmentReportPublisher
                }
            ]
        }).compile();

        service = module.get(InventoryReplenishmentService);
        jest.clearAllMocks();

    });

    it('is defined', () => {
        expect(service).toBeDefined();
    });

    it('returns a replentishment suggestion for a low-stock ingredient', async () => {
        ingredientsService.listIngredients.mockResolvedValue([
            {
                id: 'ingredient_steak',
                name: 'Steak',
                baseUnit: 'GRAM',
                lowStockThresholdQuantity: 2000,
                targetStockQuantity: 10000
            }
        ]);

        inventoryBatchesRepository.findInventoryBatchesByRestaurantId.mockResolvedValue([
            {
                ingredientId: 'ingredient_steak',
                quantityAvailable: 1500,
                isActive: true
            }
        ]);

        const result = await service.getReplenishmentSuggestions('rest_demo_001');


        expect(result).toEqual([
            {
                ingredientId: 'ingredient_steak',
                ingredientName: 'Steak',
                availableQuantity: 1500,
                targetStockQuantity: 10000,
                suggestedOrderQuantity: 8500
            }
        ]);

        expect(ingredientsService.listIngredients).toHaveBeenCalledWith(
            'rest_demo_001',
            {}
        );

        expect(
            inventoryBatchesRepository.findInventoryBatchesByRestaurantId
        ).toHaveBeenCalledWith(
            'rest_demo_001',
            { isActive: true }
        );

    });

    it('does not return a suggestion when the ingredient has sufficient stock', async () => {
        ingredientsService.listIngredients.mockResolvedValue([
            {
                id: 'ingredient_steak',
                name: 'Steak',
                baseUnit: 'GRAM',
                lowStockThresholdQuantity: 2000,
                targetStockQuantity: 10000
            }
        ]);

        inventoryBatchesRepository.findInventoryBatchesByRestaurantId.mockResolvedValue([
            {
                ingredientId: 'ingredient_steak',
                quantityAvailable: 5000,
                isActive: true
            }
        ]);
        const result = await service.getReplenishmentSuggestions('rest_demo_001');
        expect(result).toEqual([]);
    });



    describe('requestReplenishmentReport', ()=>{
        beforeEach(()=>{
            jest.useFakeTimers();
            jest.setSystemTime(new Date('2026-08-29T22:45:00.000Z'))
        })

        afterEach(()=>{
            jest.useRealTimers();
        })

        
        it('publishes a replenishment report job', ()=>{
            const result = service.requestReplenishmentReport('rest_demo_001');

            expect(replenishmentReportPublisher.publish).toHaveBeenCalledWith({
                restaurantId: 'rest_demo_001',
                requestedAt: '2026-08-29T22:45:00.000Z'
            });

            expect(result).toEqual({
                restaurantId: 'rest_demo_001',
                queued: true
            });
        })
    })


});