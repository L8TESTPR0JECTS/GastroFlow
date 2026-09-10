import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type {
  Firestore,
  Query,
} from 'firebase-admin/firestore';
import { FIRESTORE } from '../../../common/firestore/firestore.constants';
import type {
  Recommendation,
  RecommendationPriority,
  RecommendationStatus,
  RecommendationType,
} from '../models/recommendation.model';

export interface RecommendationListFilters {
  type?: RecommendationType;
  priority?: RecommendationPriority;
  status?: RecommendationStatus;
  ingredientId?: string;
  recipeId?: string;
}

@Injectable()
export class RecommendationsRepository {
  private readonly recommendationsCollection = 'recommendations';

  constructor(
    @Inject(FIRESTORE)
    private readonly firestore: Firestore,
  ) {}

  async createRecommendation(
    recommendation: Recommendation,
  ): Promise<Recommendation> {
    await this.firestore
      .collection(this.recommendationsCollection)
      .doc(recommendation.id)
      .set(recommendation);

    return recommendation;
  }

  async createRecommendations(
    recommendations: Recommendation[],
  ): Promise<Recommendation[]> {
    if (recommendations.length === 0) {
      return [];
    }

    const batch = this.firestore.batch();

    recommendations.forEach((recommendation) => {
      const ref = this.firestore
        .collection(this.recommendationsCollection)
        .doc(recommendation.id);

      batch.set(ref, recommendation);
    });

    await batch.commit();

    return recommendations;
  }

  async findRecommendationsByRestaurantId(
    restaurantId: string,
    filters: RecommendationListFilters = {},
  ): Promise<Recommendation[]> {
    let query: Query = this.firestore
      .collection(this.recommendationsCollection)
      .where('restaurantId', '==', restaurantId);

    if (filters.type) {
      query = query.where('type', '==', filters.type);
    }

    if (filters.priority) {
      query = query.where('priority', '==', filters.priority);
    }

    if (filters.status) {
      query = query.where('status', '==', filters.status);
    }

    if (filters.ingredientId) {
      query = query.where('ingredientId', '==', filters.ingredientId);
    }

    if (filters.recipeId) {
      query = query.where('recipeId', '==', filters.recipeId);
    }

    const snapshot = await query.get();

    return snapshot.docs.map((doc) => doc.data() as Recommendation);
  }

  async findRecommendationById(
    restaurantId: string,
    recommendationId: string,
  ): Promise<Recommendation> {
    const snapshot = await this.firestore
      .collection(this.recommendationsCollection)
      .doc(recommendationId)
      .get();

    if (!snapshot.exists) {
      throw new NotFoundException(
        `Recommendation ${recommendationId} was not found.`,
      );
    }

    const recommendation = snapshot.data() as Recommendation;

    if (recommendation.restaurantId !== restaurantId) {
      throw new NotFoundException(
        `Recommendation ${recommendationId} was not found.`,
      );
    }

    return recommendation;
  }

  async updateRecommendationStatus(
    restaurantId: string,
    recommendationId: string,
    status: RecommendationStatus,
    updatedAt: string,
  ): Promise<Recommendation> {
    await this.findRecommendationById(restaurantId, recommendationId);

    const ref = this.firestore
      .collection(this.recommendationsCollection)
      .doc(recommendationId);

    await ref.update({
      status,
      updatedAt,
    });

    const updatedSnapshot = await ref.get();

    return updatedSnapshot.data() as Recommendation;
  }
}