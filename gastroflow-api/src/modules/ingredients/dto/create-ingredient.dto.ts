import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
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

export class CreateIngredientDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsIn(['PROTEIN', 'VEGETABLE', 'DAIRY', 'GRAIN', 'BAKERY', 'STARCH'])
  category!: IngredientCategory;

  @IsIn(['GRAM', 'MILLILITER', 'UNIT'])
  baseUnit!: UnitOfMeasure;

  @IsIn(['REFRIGERATED', 'FROZEN', 'DRY', 'ROOM_TEMPERATURE'])
  storageType!: StorageType;

  @IsInt()
  @Min(1)
  averageShelfLifeDays!: number;

  @IsNumber()
  @Min(0)
  defaultCostPerUnit!: number;

  @IsIn(['LOW', 'MEDIUM', 'HIGH'])
  wasteRiskLevel!: WasteRiskLevel;

  @IsInt()
  @Min(0)
  recipeCoverageScore!: number;

  @IsIn(['FIFO', 'FEFO'])
  stockRotationStrategy!: StockRotationStrategy;

  @IsOptional()
  @IsNumber()
  @Min(0)
  lowStockThresholdQuantity?: number;

  @IsNumber()
  @Min(0)
  targetStockQuantity!: number;

  @IsString()
  @IsNotEmpty()
  iconKey!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
