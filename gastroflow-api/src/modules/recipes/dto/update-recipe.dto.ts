import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import type {
  RecipeCategory,
  RecipeStatus,
} from '../models/recipe.model';

export class UpdateRecipeIngredientLineDto {
  @IsString()
  ingredientId!: string;

  @IsNumber()
  @Min(0.0001)
  quantity!: number;
}

export class UpdateRecipeDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(['PLATE', 'BURGER', 'SANDWICH', 'TACO', 'BOWL', 'QUESADILLA'])
  category?: RecipeCategory;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  menuPrice?: number;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => UpdateRecipeIngredientLineDto)
  ingredients?: UpdateRecipeIngredientLineDto[];

  @IsOptional()
  @IsIn(['ACTIVE', 'INACTIVE'])
  status?: RecipeStatus;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}