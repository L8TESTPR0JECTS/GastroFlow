import type { RestaurantScopedModel } from '../../../common/models/base.model';
import type { UnitOfMeasure } from '../../ingredients/models/ingredient.model';

export type RecipeCategory =
  | 'PLATE'
  | 'BURGER'
  | 'SANDWICH'
  | 'TACO'
  | 'BOWL'
  | 'QUESADILLA';

export type RecipeStatus = 'ACTIVE' | 'INACTIVE';

export interface RecipeIngredientLine {
  ingredientId: string;
  ingredientName: string;
  quantity: number;
  unit: UnitOfMeasure;
}

export interface Recipe extends RestaurantScopedModel {
  name: string;
  nameKey: string;
  description: string;
  category: RecipeCategory;

  menuPrice: number;
  estimatedIngredientCost: number;
  estimatedGrossProfit: number;
  estimatedGrossMarginPercentage: number;

  ingredients: RecipeIngredientLine[];

  status: RecipeStatus;
  isActive: boolean;
}