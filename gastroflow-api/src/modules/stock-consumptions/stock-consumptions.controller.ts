import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { CreateRecipeSaleConsumptionDto } from './dto/create-recipe-sale-consumption.dto';
import { ListStockMovementsQueryDto } from './dto/list-stock-movements-query.dto';
import type { RecipeSaleConsumptionResult } from './models/recipe-sale-consumption-result.model';
import type { StockMovement } from './models/stock-movement.model';
import { StockConsumptionsService } from './stock-consumptions.service';

@Controller('restaurants/:restaurantId/stock-consumptions')
export class StockConsumptionsController {
  constructor(
    private readonly stockConsumptionsService: StockConsumptionsService,
  ) {}

  @Post('recipe-sale')
  async consumeRecipeSale(
    @Param('restaurantId') restaurantId: string,
    @Body() dto: CreateRecipeSaleConsumptionDto,
  ): Promise<RecipeSaleConsumptionResult> {
    return this.stockConsumptionsService.consumeRecipeSale(restaurantId, dto);
  }

  @Get('movements')
  async listStockMovements(
    @Param('restaurantId') restaurantId: string,
    @Query() query: ListStockMovementsQueryDto,
  ): Promise<StockMovement[]> {
    return this.stockConsumptionsService.listStockMovements(
      restaurantId,
      query,
    );
  }

  @Get('movements/:movementId')
  async getStockMovementById(
    @Param('restaurantId') restaurantId: string,
    @Param('movementId') movementId: string,
  ): Promise<StockMovement> {
    return this.stockConsumptionsService.getStockMovementById(
      restaurantId,
      movementId,
    );
  }
}
