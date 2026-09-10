import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Firestore } from 'firebase-admin/firestore';
import type { Query } from 'firebase-admin/firestore';
import { FIRESTORE } from '../../../common/firestore/firestore.constants';
import type {
  Ingredient,
  IngredientCategory,
  WasteRiskLevel,
} from '../models/ingredient.model';

export interface IngredientListFilters {
  category?: IngredientCategory;
  wasteRiskLevel?: WasteRiskLevel;
  isActive?: boolean;
}

@Injectable()
export class IngredientsRepository {
  private readonly ingredientsCollection = 'ingredients';

  constructor(
    @Inject(FIRESTORE)
    private readonly firestore: Firestore,
  ) {}

  async createIngredient(ingredient: Ingredient): Promise<Ingredient> {
    await this.firestore
      .collection(this.ingredientsCollection)
      .doc(ingredient.id)
      .set(ingredient);

    return ingredient;
  }

  async upsertIngredient(ingredient: Ingredient): Promise<Ingredient> {
    await this.firestore
      .collection(this.ingredientsCollection)
      .doc(ingredient.id)
      .set(ingredient, { merge: true });

    return ingredient;
  }

  async findIngredientsByRestaurantId(
    restaurantId: string,
    filters: IngredientListFilters = {},
  ): Promise<Ingredient[]> {
    let query: Query = this.firestore
      .collection(this.ingredientsCollection)
      .where('restaurantId', '==', restaurantId);

    if (filters.category) {
      query = query.where('category', '==', filters.category);
    }

    if (filters.wasteRiskLevel) {
      query = query.where('wasteRiskLevel', '==', filters.wasteRiskLevel);
    }

    if (typeof filters.isActive === 'boolean') {
      query = query.where('isActive', '==', filters.isActive);
    }

    const snapshot = await query.get();

    return snapshot.docs.map((doc) => doc.data() as Ingredient);
  }

  async findIngredientById(
    restaurantId: string,
    ingredientId: string,
  ): Promise<Ingredient> {
    const snapshot = await this.firestore
      .collection(this.ingredientsCollection)
      .doc(ingredientId)
      .get();

    if (!snapshot.exists) {
      throw new NotFoundException(`Ingredient ${ingredientId} was not found.`);
    }

    const ingredient = snapshot.data() as Ingredient;

    if (ingredient.restaurantId !== restaurantId) {
      throw new NotFoundException(`Ingredient ${ingredientId} was not found.`);
    }

    return ingredient;
  }

  async updateIngredient(
    restaurantId: string,
    ingredientId: string,
    changes: Partial<Ingredient>,
  ): Promise<Ingredient> {
    await this.findIngredientById(restaurantId, ingredientId);

    const ref = this.firestore
      .collection(this.ingredientsCollection)
      .doc(ingredientId);

    await ref.update(changes);

    const updatedSnapshot = await ref.get();

    return updatedSnapshot.data() as Ingredient;
  }

  async softDeleteIngredient(
    restaurantId: string,
    ingredientId: string,
    updatedAt: string,
  ): Promise<Ingredient> {
    return this.updateIngredient(restaurantId, ingredientId, {
      isActive: false,
      updatedAt,
    });
  }

    async findIngredientByNameKey(
        restaurantId: string,
        nameKey: string,
    ): Promise<Ingredient | null> {
        const snapshot = await this.firestore
            .collection(this.ingredientsCollection)
            .where('restaurantId', '==', restaurantId)
            .where('nameKey', '==', nameKey)
            .limit(1)
            .get();

        if (snapshot.empty) {
            return null;
        }

        return snapshot.docs[0].data() as Ingredient;
    }
}