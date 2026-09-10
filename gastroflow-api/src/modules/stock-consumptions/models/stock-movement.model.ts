import type { RestaurantScopedModel } from '../../../common/models/base.model';
import type { UnitOfMeasure } from '../../ingredients/models/ingredient.model';

export type StockMovementType =
  | 'CONSUMPTION'
  | 'ADJUSTMENT'
  | 'WASTE'
  | 'RECOUNT'
  | 'REVERSAL';

export type StockMovementSource =
  | 'RECIPE_SALE'
  | 'SIMULATION'
  | 'MANUAL';

export interface StockMovement extends RestaurantScopedModel {
  inventoryBatchId: string;

  ingredientId: string;
  ingredientName: string;

  recipeId?: string;
  recipeName?: string;
  saleId?: string;
  quantitySold?: number;
  unitMenuPrice?: number;
  totalSalesRevenue?: number;
  inventoryCostConsumed?: number;
  estimatedGrossProfit?: number;
  estimatedGrossMarginPercentage?: number;

  movementType: StockMovementType;
  source: StockMovementSource;

  quantity: number;
  unit: UnitOfMeasure;

  unitCost: number;
  totalCost: number;

  occurredAt: string;

  notes?: string;
}
