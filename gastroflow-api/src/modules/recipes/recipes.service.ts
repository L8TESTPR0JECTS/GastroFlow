import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { createAuditTimestamps } from '../../common/utils/audit.util';
import { nowIso } from '../../common/utils/date.util';
import { createSlug } from '../../common/utils/slug.util';
import { IngredientsService } from '../ingredients/ingredients.service';
import { RestaurantsService } from '../restaurants/restaurants.service';
import { DEMO_RECIPES } from './data/demo-recipes.data';
import {
  CreateRecipeDto,
  CreateRecipeIngredientLineDto,
} from './dto/create-recipe.dto';
import { ListRecipesQueryDto } from './dto/list-recipes-query.dto';
import {
  UpdateRecipeDto,
  UpdateRecipeIngredientLineDto,
} from './dto/update-recipe.dto';
import type {
  Recipe,
  RecipeIngredientLine,
} from './models/recipe.model';
import {
  RecipeListFilters,
  RecipesRepository,
} from './repositories/recipes.repository';

@Injectable()
export class RecipesService {
  constructor(
    private readonly recipesRepository: RecipesRepository,
    private readonly restaurantsService: RestaurantsService,
    private readonly ingredientsService: IngredientsService,
  ) {}

  async createRecipe(
    restaurantId: string,
    dto: CreateRecipeDto,
  ): Promise<Recipe> {
    await this.restaurantsService.getRestaurantById(restaurantId);

    const name = this.normalizeDisplayName(dto.name);
    const nameKey = this.createNameKey(name);

    const existingRecipe = await this.recipesRepository.findRecipeByNameKey(
      restaurantId,
      nameKey,
    );

    if (existingRecipe) {
      throw new ConflictException(
        `Recipe "${name}" already exists for restaurant ${restaurantId}.`,
      );
    }

    const recipeLines = await this.buildRecipeIngredientLines(
      restaurantId,
      dto.ingredients,
    );

    const estimatedIngredientCost =
      await this.calculateEstimatedIngredientCost(
        restaurantId,
        dto.ingredients,
      );

    const profitability = this.calculateProfitability(
      dto.menuPrice,
      estimatedIngredientCost,
    );

    const audit = createAuditTimestamps();

    const recipe: Recipe = {
      id: this.createRecipeId(restaurantId, nameKey),
      restaurantId,
      name,
      nameKey,
      description: dto.description.trim(),
      category: dto.category,
      menuPrice: dto.menuPrice,
      estimatedIngredientCost,
      estimatedGrossProfit: profitability.estimatedGrossProfit,
      estimatedGrossMarginPercentage:
        profitability.estimatedGrossMarginPercentage,
      ingredients: recipeLines,
      status: 'ACTIVE',
      isActive: true,
      ...audit,
    };

    return this.recipesRepository.createRecipe(recipe);
  }

  async listRecipes(
    restaurantId: string,
    query: ListRecipesQueryDto,
  ): Promise<Recipe[]> {
    await this.restaurantsService.getRestaurantById(restaurantId);

    const filters = this.buildListFilters(query);

    return this.recipesRepository.findRecipesByRestaurantId(
      restaurantId,
      filters,
    );
  }

  async getRecipeById(
    restaurantId: string,
    recipeId: string,
  ): Promise<Recipe> {
    return this.recipesRepository.findRecipeById(restaurantId, recipeId);
  }

  async updateRecipe(
    restaurantId: string,
    recipeId: string,
    dto: UpdateRecipeDto,
  ): Promise<Recipe> {
    await this.restaurantsService.getRestaurantById(restaurantId);

    const currentRecipe = await this.recipesRepository.findRecipeById(
      restaurantId,
      recipeId,
    );

    const changes: Partial<Recipe> = {
      updatedAt: nowIso(),
    };

    let nextMenuPrice = currentRecipe.menuPrice;
    let nextIngredients = currentRecipe.ingredients;
    let shouldRecalculateProfitability = false;

    if (dto.name !== undefined) {
      const name = this.normalizeDisplayName(dto.name);
      const nameKey = this.createNameKey(name);

      const existingRecipe = await this.recipesRepository.findRecipeByNameKey(
        restaurantId,
        nameKey,
      );

      if (existingRecipe && existingRecipe.id !== currentRecipe.id) {
        throw new ConflictException(
          `Recipe "${name}" already exists for restaurant ${restaurantId}.`,
        );
      }

      changes.name = name;
      changes.nameKey = nameKey;
    }

    if (dto.description !== undefined) {
      changes.description = dto.description.trim();
    }

    if (dto.category !== undefined) {
      changes.category = dto.category;
    }

    if (dto.menuPrice !== undefined) {
      nextMenuPrice = dto.menuPrice;
      changes.menuPrice = dto.menuPrice;
      shouldRecalculateProfitability = true;
    }

    if (dto.ingredients !== undefined) {
      nextIngredients = await this.buildRecipeIngredientLines(
        restaurantId,
        dto.ingredients,
      );

      changes.ingredients = nextIngredients;
      shouldRecalculateProfitability = true;
    }

    if (shouldRecalculateProfitability) {
      const estimatedIngredientCost =
        await this.calculateEstimatedIngredientCostFromLines(
          restaurantId,
          nextIngredients,
        );

      const profitability = this.calculateProfitability(
        nextMenuPrice,
        estimatedIngredientCost,
      );

      changes.estimatedIngredientCost = estimatedIngredientCost;
      changes.estimatedGrossProfit = profitability.estimatedGrossProfit;
      changes.estimatedGrossMarginPercentage =
        profitability.estimatedGrossMarginPercentage;
    }

    if (dto.status !== undefined) {
      changes.status = dto.status;
    }

    if (dto.isActive !== undefined) {
      changes.isActive = dto.isActive;
    }

    return this.recipesRepository.updateRecipe(
      restaurantId,
      recipeId,
      changes,
    );
  }

  async softDeleteRecipe(
    restaurantId: string,
    recipeId: string,
  ): Promise<Recipe> {
    await this.restaurantsService.getRestaurantById(restaurantId);

    return this.recipesRepository.softDeleteRecipe(
      restaurantId,
      recipeId,
      nowIso(),
    );
  }

  async seedDemoRecipes(restaurantId: string): Promise<{
    restaurantId: string;
    recipesCreated: number;
    recipes: Recipe[];
  }> {
    await this.restaurantsService.getRestaurantById(restaurantId);

    const audit = createAuditTimestamps();

    const recipes = await Promise.all(
      DEMO_RECIPES.map(async (seedRecipe) => {
        const name = this.normalizeDisplayName(seedRecipe.name);
        const nameKey = this.createNameKey(name);

        const ingredientDtos = seedRecipe.ingredients.map((ingredient) => ({
          ingredientId: this.createIngredientIdFromNameKey(
            restaurantId,
            ingredient.ingredientNameKey,
          ),
          quantity: ingredient.quantity,
        }));

        const recipeLines = await this.buildRecipeIngredientLines(
          restaurantId,
          ingredientDtos,
        );

        const estimatedIngredientCost =
          await this.calculateEstimatedIngredientCost(
            restaurantId,
            ingredientDtos,
          );

        const profitability = this.calculateProfitability(
          seedRecipe.menuPrice,
          estimatedIngredientCost,
        );

        const recipe: Recipe = {
          id: this.createRecipeId(restaurantId, nameKey),
          restaurantId,
          name,
          nameKey,
          description: seedRecipe.description,
          category: seedRecipe.category,
          menuPrice: seedRecipe.menuPrice,
          estimatedIngredientCost,
          estimatedGrossProfit: profitability.estimatedGrossProfit,
          estimatedGrossMarginPercentage:
            profitability.estimatedGrossMarginPercentage,
          ingredients: recipeLines,
          status: 'ACTIVE',
          isActive: true,
          ...audit,
        };

        return recipe;
      }),
    );

    const savedRecipes = await Promise.all(
      recipes.map((recipe) => this.recipesRepository.upsertRecipe(recipe)),
    );

    return {
      restaurantId,
      recipesCreated: savedRecipes.length,
      recipes: savedRecipes,
    };
  }

  private async buildRecipeIngredientLines(
    restaurantId: string,
    ingredients:
      | CreateRecipeIngredientLineDto[]
      | UpdateRecipeIngredientLineDto[],
  ): Promise<RecipeIngredientLine[]> {
    const seenIngredientIds = new Set<string>();

    const lines = await Promise.all(
      ingredients.map(async (ingredientLine) => {
        if (seenIngredientIds.has(ingredientLine.ingredientId)) {
          throw new BadRequestException(
            `Duplicate ingredient line detected for ${ingredientLine.ingredientId}.`,
          );
        }

        seenIngredientIds.add(ingredientLine.ingredientId);

        const ingredient = await this.ingredientsService.getIngredientById(
          restaurantId,
          ingredientLine.ingredientId,
        );

        return {
          ingredientId: ingredient.id,
          ingredientName: ingredient.name,
          quantity: ingredientLine.quantity,
          unit: ingredient.baseUnit,
        };
      }),
    );

    return lines;
  }

  private async calculateEstimatedIngredientCost(
    restaurantId: string,
    ingredients:
      | CreateRecipeIngredientLineDto[]
      | UpdateRecipeIngredientLineDto[],
  ): Promise<number> {
    const lines = await Promise.all(
      ingredients.map(async (ingredientLine) => {
        const ingredient = await this.ingredientsService.getIngredientById(
          restaurantId,
          ingredientLine.ingredientId,
        );

        return ingredientLine.quantity * ingredient.defaultCostPerUnit;
      }),
    );

    return this.roundMoney(
      lines.reduce((total, lineCost) => total + lineCost, 0),
    );
  }

  private async calculateEstimatedIngredientCostFromLines(
    restaurantId: string,
    lines: RecipeIngredientLine[],
  ): Promise<number> {
    const costs = await Promise.all(
      lines.map(async (line) => {
        const ingredient = await this.ingredientsService.getIngredientById(
          restaurantId,
          line.ingredientId,
        );

        return line.quantity * ingredient.defaultCostPerUnit;
      }),
    );

    return this.roundMoney(
      costs.reduce((total, lineCost) => total + lineCost, 0),
    );
  }

  private calculateProfitability(
    menuPrice: number,
    estimatedIngredientCost: number,
  ): {
    estimatedGrossProfit: number;
    estimatedGrossMarginPercentage: number;
  } {
    const estimatedGrossProfit = this.roundMoney(
      menuPrice - estimatedIngredientCost,
    );

    const estimatedGrossMarginPercentage = Number(
      ((estimatedGrossProfit / menuPrice) * 100).toFixed(2),
    );

    return {
      estimatedGrossProfit,
      estimatedGrossMarginPercentage,
    };
  }

  private buildListFilters(query: ListRecipesQueryDto): RecipeListFilters {
    const filters: RecipeListFilters = {};

    if (query.category) {
      filters.category = query.category;
    }

    if (query.status) {
      filters.status = query.status;
    }

    if (query.isActive === undefined) {
      filters.isActive = true;
    } else {
      filters.isActive = query.isActive === 'true';
    }

    return filters;
  }

  private normalizeDisplayName(name: string): string {
    const normalizedName = name.trim().replace(/\s+/g, ' ');

    if (!normalizedName) {
      throw new BadRequestException('Recipe name cannot be empty.');
    }

    return normalizedName;
  }

  private createNameKey(name: string): string {
    return createSlug(name);
  }

  private createRecipeId(restaurantId: string, nameKey: string): string {
    const safeRestaurantId = restaurantId.replace(/[^a-zA-Z0-9_]/g, '_');
    const safeNameKey = nameKey.replace(/-/g, '_');

    return `recipe_${safeRestaurantId}_${safeNameKey}`;
  }

  private createIngredientIdFromNameKey(
    restaurantId: string,
    ingredientNameKey: string,
  ): string {
    const safeRestaurantId = restaurantId.replace(/[^a-zA-Z0-9_]/g, '_');
    const safeIngredientNameKey = ingredientNameKey.replace(/-/g, '_');

    return `ingredient_${safeRestaurantId}_${safeIngredientNameKey}`;
  }

  private roundMoney(value: number): number {
    return Number(value.toFixed(4));
  }
}