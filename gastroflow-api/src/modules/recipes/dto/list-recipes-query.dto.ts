import {
  IsBooleanString,
  IsIn,
  IsOptional,
} from 'class-validator';
import type {
  RecipeCategory,
  RecipeStatus,
} from '../models/recipe.model';

export class ListRecipesQueryDto {
  @IsOptional()
  @IsIn(['PLATE', 'BURGER', 'SANDWICH', 'TACO', 'BOWL', 'QUESADILLA'])
  category?: RecipeCategory;

  @IsOptional()
  @IsIn(['ACTIVE', 'INACTIVE'])
  status?: RecipeStatus;

  @IsOptional()
  @IsBooleanString()
  isActive?: string;
}