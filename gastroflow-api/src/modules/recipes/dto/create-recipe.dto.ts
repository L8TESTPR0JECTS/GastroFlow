import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import type { RecipeCategory } from '../models/recipe.model';

export class CreateRecipeIngredientLineDto {
  @IsString()
  @IsNotEmpty()
  ingredientId!: string;

  @IsNumber()
  @Min(0.0001)
  quantity!: number;
}

export class CreateRecipeDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsIn(['PLATE', 'BURGER', 'SANDWICH', 'TACO', 'BOWL', 'QUESADILLA'])
  category!: RecipeCategory;

  @IsNumber()
  @Min(0.01)
  menuPrice!: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateRecipeIngredientLineDto)
  ingredients!: CreateRecipeIngredientLineDto[];
}