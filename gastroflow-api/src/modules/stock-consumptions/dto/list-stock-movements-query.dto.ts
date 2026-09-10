import {
  IsIn,
  IsOptional,
  IsString,
} from 'class-validator';
import type {
  StockMovementSource,
  StockMovementType,
} from '../models/stock-movement.model';

export class ListStockMovementsQueryDto {
  @IsOptional()
  @IsString()
  ingredientId?: string;

  @IsOptional()
  @IsString()
  inventoryBatchId?: string;

  @IsOptional()
  @IsString()
  recipeId?: string;

  @IsOptional()
  @IsIn(['CONSUMPTION', 'ADJUSTMENT', 'WASTE', 'RECOUNT', 'REVERSAL'])
  movementType?: StockMovementType;

  @IsOptional()
  @IsIn(['RECIPE_SALE', 'SIMULATION', 'MANUAL'])
  source?: StockMovementSource;
}