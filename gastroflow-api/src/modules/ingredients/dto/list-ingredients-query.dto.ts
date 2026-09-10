import { IsBooleanString, IsIn, IsOptional } from 'class-validator';
import type {
  IngredientCategory,
  WasteRiskLevel,
} from '../models/ingredient.model';

export class ListIngredientsQueryDto {
  @IsOptional()
  @IsIn(['PROTEIN', 'VEGETABLE', 'DAIRY', 'GRAIN', 'BAKERY', 'STARCH'])
  category?: IngredientCategory;

  @IsOptional()
  @IsIn(['LOW', 'MEDIUM', 'HIGH'])
  wasteRiskLevel?: WasteRiskLevel;

  @IsOptional()
  @IsBooleanString()
  isActive?: string;
}