import type { Recommendation } from './recommendation.model';

export interface GenerateRecommendationsResult {
  restaurantId: string;
  generatedCount: number;
  recommendations: Recommendation[];
}