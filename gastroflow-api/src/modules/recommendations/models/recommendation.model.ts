import type { RestaurantScopedModel } from '../../../common/models/base.model';

export type RecommendationType =
  | 'USE_SOON'
  | 'REDUCE_PURCHASE'
  | 'PROMOTE_RECIPE'
  | 'HIGH_MARGIN_OPPORTUNITY'
  | 'LOW_STOCK_RISK'
  | 'OVERSTOCK_RISK'
  | 'WASTE_PATTERN_DETECTED'
  | 'RECIPE_COST_WARNING'
  | 'MENU_PRICE_OPPORTUNITY'
  | 'BATCH_ROTATION_WARNING'
  | 'EXPIRATION_CLUSTER'
  | 'INVENTORY_IDLE';

export type RecommendationPriority =
  | 'LOW'
  | 'MEDIUM'
  | 'HIGH';

export type RecommendationStatus =
  | 'OPEN'
  | 'DISMISSED'
  | 'APPLIED';

export interface Recommendation extends RestaurantScopedModel {
  type: RecommendationType;
  priority: RecommendationPriority;

  title: string;
  message: string;

  status: RecommendationStatus;

  ingredientId?: string;
  ingredientName?: string;

  recipeId?: string;
  recipeName?: string;

  relatedRecipeIds: string[];
  relatedInventoryBatchIds: string[];

  reasonCode: string;
}