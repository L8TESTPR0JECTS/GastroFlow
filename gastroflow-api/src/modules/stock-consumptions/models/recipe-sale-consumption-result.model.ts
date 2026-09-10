import type { StockMovement } from './stock-movement.model';

export interface RecipeSaleConsumptionIngredientSummary {
  ingredientId: string;
  ingredientName: string;
  quantityRequired: number;
  quantityConsumed: number;
  totalCost: number;
}

export interface RecipeSaleConsumptionResult {
  restaurantId: string;

  recipeId: string;
  recipeName: string;
  quantitySold: number;

  unitMenuPrice: number;
  totalSalesRevenue: number;
  inventoryCostConsumed: number;
  estimatedGrossProfit: number;
  estimatedGrossMarginPercentage: number;

  ingredients: RecipeSaleConsumptionIngredientSummary[];
  movements: StockMovement[];
}
