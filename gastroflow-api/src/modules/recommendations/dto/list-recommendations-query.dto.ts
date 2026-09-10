import { IsIn, IsOptional, IsString } from 'class-validator';
import type {
  RecommendationPriority,
  RecommendationStatus,
  RecommendationType,
} from '../models/recommendation.model';

const RECOMMENDATION_TYPES: RecommendationType[] = [
  'USE_SOON',
  'REDUCE_PURCHASE',
  'PROMOTE_RECIPE',
  'HIGH_MARGIN_OPPORTUNITY',
  'LOW_STOCK_RISK',
  'OVERSTOCK_RISK',
  'WASTE_PATTERN_DETECTED',
  'RECIPE_COST_WARNING',
  'MENU_PRICE_OPPORTUNITY',
  'BATCH_ROTATION_WARNING',
  'EXPIRATION_CLUSTER',
  'INVENTORY_IDLE',
];

const RECOMMENDATION_PRIORITIES: RecommendationPriority[] = [
  'LOW',
  'MEDIUM',
  'HIGH',
];

const RECOMMENDATION_STATUSES: RecommendationStatus[] = [
  'OPEN',
  'DISMISSED',
  'APPLIED',
];

export class ListRecommendationsQueryDto {
  @IsOptional()
  @IsIn(RECOMMENDATION_TYPES)
  type?: RecommendationType;

  @IsOptional()
  @IsIn(RECOMMENDATION_PRIORITIES)
  priority?: RecommendationPriority;

  @IsOptional()
  @IsIn(RECOMMENDATION_STATUSES)
  status?: RecommendationStatus;

  @IsOptional()
  @IsString()
  ingredientId?: string;

  @IsOptional()
  @IsString()
  recipeId?: string;
}
