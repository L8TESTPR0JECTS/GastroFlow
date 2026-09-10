import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Firestore } from 'firebase-admin/firestore';
import type { Query } from 'firebase-admin/firestore';
import { FIRESTORE } from '../../../common/firestore/firestore.constants';
import type {
  Recipe,
  RecipeCategory,
  RecipeStatus,
} from '../models/recipe.model';

export interface RecipeListFilters {
  category?: RecipeCategory;
  status?: RecipeStatus;
  isActive?: boolean;
}

@Injectable()
export class RecipesRepository {
  private readonly recipesCollection = 'recipes';

  constructor(
    @Inject(FIRESTORE)
    private readonly firestore: Firestore,
  ) {}

  async createRecipe(recipe: Recipe): Promise<Recipe> {
    await this.firestore
      .collection(this.recipesCollection)
      .doc(recipe.id)
      .set(recipe);

    return recipe;
  }

  async upsertRecipe(recipe: Recipe): Promise<Recipe> {
    await this.firestore
      .collection(this.recipesCollection)
      .doc(recipe.id)
      .set(recipe, { merge: true });

    return recipe;
  }

  async findRecipesByRestaurantId(
    restaurantId: string,
    filters: RecipeListFilters = {},
  ): Promise<Recipe[]> {
    let query: Query = this.firestore
      .collection(this.recipesCollection)
      .where('restaurantId', '==', restaurantId);

    if (filters.category) {
      query = query.where('category', '==', filters.category);
    }

    if (filters.status) {
      query = query.where('status', '==', filters.status);
    }

    if (typeof filters.isActive === 'boolean') {
      query = query.where('isActive', '==', filters.isActive);
    }

    const snapshot = await query.get();

    return snapshot.docs.map((doc) => doc.data() as Recipe);
  }

  async findRecipeById(
    restaurantId: string,
    recipeId: string,
  ): Promise<Recipe> {
    const snapshot = await this.firestore
      .collection(this.recipesCollection)
      .doc(recipeId)
      .get();

    if (!snapshot.exists) {
      throw new NotFoundException(`Recipe ${recipeId} was not found.`);
    }

    const recipe = snapshot.data() as Recipe;

    if (recipe.restaurantId !== restaurantId) {
      throw new NotFoundException(`Recipe ${recipeId} was not found.`);
    }

    return recipe;
  }

  async updateRecipe(
    restaurantId: string,
    recipeId: string,
    changes: Partial<Recipe>,
  ): Promise<Recipe> {
    await this.findRecipeById(restaurantId, recipeId);

    const ref = this.firestore
      .collection(this.recipesCollection)
      .doc(recipeId);

    await ref.update(changes);

    const updatedSnapshot = await ref.get();

    return updatedSnapshot.data() as Recipe;
  }

  async softDeleteRecipe(
    restaurantId: string,
    recipeId: string,
    updatedAt: string,
  ): Promise<Recipe> {
    return this.updateRecipe(restaurantId, recipeId, {
      isActive: false,
      status: 'INACTIVE',
      updatedAt,
    });
  }

  async findRecipeByNameKey(
    restaurantId: string,
    nameKey: string,
  ): Promise<Recipe | null> {
    const snapshot = await this.firestore
      .collection(this.recipesCollection)
      .where('restaurantId', '==', restaurantId)
      .where('nameKey', '==', nameKey)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    return snapshot.docs[0].data() as Recipe;
  }
}