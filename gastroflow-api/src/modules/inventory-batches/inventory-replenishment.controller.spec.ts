import { Test } from '@nestjs/testing';

jest.mock('./services/inventory-replenishment.service', () => ({
  InventoryReplenishmentService: class InventoryReplenishmentService {}
}));


import { InventoryReplenishmentController } from './inventory-replenishment.controller';
import { InventoryReplenishmentService } from './services/inventory-replenishment.service';

describe('InventoryReplenishmentController', () => {
  let controller: InventoryReplenishmentController;

  const inventoryReplenishmentService = {
    getReplenishmentSuggestions: jest.fn()
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [InventoryReplenishmentController],
      providers: [
        {
          provide: InventoryReplenishmentService,
          useValue: inventoryReplenishmentService
        }
      ]
    }).compile();

    controller = module.get(InventoryReplenishmentController);

    jest.clearAllMocks();
  });

  it('returns replenishment suggestions for a restaurant', async () => {
    inventoryReplenishmentService
      .getReplenishmentSuggestions
      .mockResolvedValue([
        {
          ingredientId: 'ingredient_steak',
          ingredientName: 'Steak',
          availableQuantity: 1500,
          targetStockQuantity: 10000,
          suggestedOrderQuantity: 8500
        }
      ]);

    const result = await controller.getReplenishmentSuggestions(
      'rest_demo_001'
    );

    expect(result).toEqual([
      {
        ingredientId: 'ingredient_steak',
        ingredientName: 'Steak',
        availableQuantity: 1500,
        targetStockQuantity: 10000,
        suggestedOrderQuantity: 8500
      }
    ]);

    expect(
      inventoryReplenishmentService.getReplenishmentSuggestions
    ).toHaveBeenCalledWith('rest_demo_001');
  });
});