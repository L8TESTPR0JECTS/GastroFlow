import { Controller, Get, Param, Post } from '@nestjs/common';

import { InventoryReplenishmentService } from './services/inventory-replenishment.service';

@Controller('restaurants/:restaurantId/inventory/replenishment')
export class InventoryReplenishmentController {
  constructor(
    private readonly inventoryReplenishmentService:
      InventoryReplenishmentService
  ) {}

  @Get('suggestions')
  async getReplenishmentSuggestions(
    @Param('restaurantId') restaurantId: string
  ) {
    return this.inventoryReplenishmentService
      .getReplenishmentSuggestions(restaurantId);
  }

  @Post('report')
  requestReplenishmentReport(
    @Param('restaurantId') restaurantId: string
  ) {
    return this.inventoryReplenishmentService
      .requestReplenishmentReport(restaurantId);
  }
}