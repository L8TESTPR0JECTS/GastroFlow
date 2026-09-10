import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import type {
  IngredientCategory,
  StorageType,
  UnitOfMeasure,
  WasteRiskLevel,
  StockRotationStrategy,
} from '../models/ingredient.model';

export class UpdateIngredientDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsIn(['PROTEIN', 'VEGETABLE', 'DAIRY', 'GRAIN', 'BAKERY', 'STARCH'])
  category?: IngredientCategory;

  @IsOptional()
  @IsIn(['GRAM', 'MILLILITER', 'UNIT'])
  baseUnit?: UnitOfMeasure;

  @IsOptional()
  @IsIn(['REFRIGERATED', 'FROZEN', 'DRY', 'ROOM_TEMPERATURE'])
  storageType?: StorageType;

  @IsOptional()
  @IsInt()
  @Min(1)
  averageShelfLifeDays?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  defaultCostPerUnit?: number;

  @IsOptional()
  @IsIn(['LOW', 'MEDIUM', 'HIGH'])
  wasteRiskLevel?: WasteRiskLevel;

  @IsOptional()
  @IsInt()
  @Min(0)
  recipeCoverageScore?: number;

  @IsOptional()
  @IsIn(['FIFO', 'FEFO'])
  stockRotationStrategy?: StockRotationStrategy;

  @IsOptional()
  @IsNumber()
  @Min(0)
  lowStockThresholdQuantity?: number;

  @IsOptional()
  @IsString()
  iconKey?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
