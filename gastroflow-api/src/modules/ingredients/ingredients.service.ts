import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { createSlug } from '../../common/utils/slug.util';
import { nowIso } from '../../common/utils/date.util';
import { createAuditTimestamps } from '../../common/utils/audit.util';
import { RestaurantsService } from '../restaurants/restaurants.service';
import { DEMO_INGREDIENTS } from './data/demo-ingredients.data';
import { CreateIngredientDto } from './dto/create-ingredient.dto';
import { ListIngredientsQueryDto } from './dto/list-ingredients-query.dto';
import { UpdateIngredientDto } from './dto/update-ingredient.dto';
import type { Ingredient } from './models/ingredient.model';
import {
  IngredientListFilters,
  IngredientsRepository,
} from './repositories/ingredients.repository';

@Injectable()
export class IngredientsService {
  constructor(
    private readonly ingredientsRepository: IngredientsRepository,
    private readonly restaurantsService: RestaurantsService,
  ) {}

  async createIngredient(
    restaurantId: string,
    dto: CreateIngredientDto,
  ): Promise<Ingredient> {
    await this.restaurantsService.getRestaurantById(restaurantId);

    const name = this.normalizeDisplayName(dto.name);
    const nameKey = this.createNameKey(name);

    const existingIngredient =
      await this.ingredientsRepository.findIngredientByNameKey(
        restaurantId,
        nameKey,
      );

    if (existingIngredient) {
      throw new ConflictException(
        `Ingredient "${name}" already exists for restaurant ${restaurantId}.`,
      );
    }

    const audit = createAuditTimestamps();
    const lowStockThresholdQuantity = dto.lowStockThresholdQuantity ?? this.createDefaultLowStockThreshold(dto.baseUnit);

    const ingredient: Ingredient = {
      id: this.createIngredientId(restaurantId, nameKey),
      restaurantId,
      name,
      nameKey,
      category: dto.category,
      baseUnit: dto.baseUnit,
      storageType: dto.storageType,
      averageShelfLifeDays: dto.averageShelfLifeDays,
      defaultCostPerUnit: dto.defaultCostPerUnit,
      wasteRiskLevel: dto.wasteRiskLevel,
      recipeCoverageScore: dto.recipeCoverageScore,
      stockRotationStrategy: dto.stockRotationStrategy,
      lowStockThresholdQuantity,
      targetStockQuantity: dto.targetStockQuantity,
      iconKey: dto.iconKey.trim(),
      description: dto.description.trim(),
      isActive: dto.isActive ?? true,
      ...audit,
    };

    return this.ingredientsRepository.createIngredient(ingredient);
  }

  async listIngredients(
    restaurantId: string,
    query: ListIngredientsQueryDto,
  ): Promise<Ingredient[]> {
    await this.restaurantsService.getRestaurantById(restaurantId);

    const filters = this.buildListFilters(query);

    return this.ingredientsRepository.findIngredientsByRestaurantId(
      restaurantId,
      filters,
    );
  }

  async getIngredientById(
    restaurantId: string,
    ingredientId: string,
  ): Promise<Ingredient> {
    return this.ingredientsRepository.findIngredientById(
      restaurantId,
      ingredientId,
    );
  }

  async updateIngredient(
    restaurantId: string,
    ingredientId: string,
    dto: UpdateIngredientDto,
  ): Promise<Ingredient> {
    await this.restaurantsService.getRestaurantById(restaurantId);

    const currentIngredient =
      await this.ingredientsRepository.findIngredientById(
        restaurantId,
        ingredientId,
      );

    const changes: Partial<Ingredient> = {
      updatedAt: nowIso(),
    };

    if (dto.name !== undefined) {
      const name = this.normalizeDisplayName(dto.name);
      const nameKey = this.createNameKey(name);

      const existingIngredient =
        await this.ingredientsRepository.findIngredientByNameKey(
          restaurantId,
          nameKey,
        );

      if (
        existingIngredient &&
        existingIngredient.id !== currentIngredient.id
      ) {
        throw new ConflictException(
          `Ingredient "${name}" already exists for restaurant ${restaurantId}.`,
        );
      }

      changes.name = name;
      changes.nameKey = nameKey;
    }

    if (dto.category !== undefined) {
      changes.category = dto.category;
    }

    if (dto.baseUnit !== undefined) {
      changes.baseUnit = dto.baseUnit;
    }

    if (dto.storageType !== undefined) {
      changes.storageType = dto.storageType;
    }

    if (dto.averageShelfLifeDays !== undefined) {
      changes.averageShelfLifeDays = dto.averageShelfLifeDays;
    }

    if (dto.defaultCostPerUnit !== undefined) {
      changes.defaultCostPerUnit = dto.defaultCostPerUnit;
    }

    if (dto.wasteRiskLevel !== undefined) {
      changes.wasteRiskLevel = dto.wasteRiskLevel;
    }

    if (dto.recipeCoverageScore !== undefined) {
      changes.recipeCoverageScore = dto.recipeCoverageScore;
    }

    if (dto.stockRotationStrategy !== undefined) {
      changes.stockRotationStrategy = dto.stockRotationStrategy;
    }

    if (dto.lowStockThresholdQuantity !== undefined) {
      changes.lowStockThresholdQuantity = dto.lowStockThresholdQuantity;
    }

    if (dto.iconKey !== undefined) {
      changes.iconKey = dto.iconKey.trim();
    }

    if (dto.description !== undefined) {
      changes.description = dto.description.trim();
    }

    if (dto.isActive !== undefined) {
      changes.isActive = dto.isActive;
    }

    return this.ingredientsRepository.updateIngredient(
      restaurantId,
      ingredientId,
      changes,
    );
  }

  async softDeleteIngredient(
    restaurantId: string,
    ingredientId: string,
  ): Promise<Ingredient> {
    await this.restaurantsService.getRestaurantById(restaurantId);

    return this.ingredientsRepository.softDeleteIngredient(
      restaurantId,
      ingredientId,
      nowIso(),
    );
  }

  async seedDemoIngredients(restaurantId: string): Promise<{
    restaurantId: string;
    ingredientsCreated: number;
    ingredients: Ingredient[];
  }> {
    await this.restaurantsService.getRestaurantById(restaurantId);

    const audit = createAuditTimestamps();

    const ingredients = DEMO_INGREDIENTS.map((seedIngredient) => {
      const name = this.normalizeDisplayName(seedIngredient.name);
      const nameKey = this.createNameKey(name);

      const ingredient: Ingredient = {
        id: this.createIngredientId(restaurantId, nameKey),
        restaurantId,
        name,
        nameKey,
        category: seedIngredient.category,
        baseUnit: seedIngredient.baseUnit,
        storageType: seedIngredient.storageType,
        averageShelfLifeDays: seedIngredient.averageShelfLifeDays,
        defaultCostPerUnit: seedIngredient.defaultCostPerUnit,
        wasteRiskLevel: seedIngredient.wasteRiskLevel,
        recipeCoverageScore: seedIngredient.recipeCoverageScore,
        stockRotationStrategy: seedIngredient.stockRotationStrategy,
        lowStockThresholdQuantity: seedIngredient.lowStockThresholdQuantity,
        targetStockQuantity: seedIngredient.targetStockQuantity,
        iconKey: seedIngredient.iconKey,
        description: seedIngredient.description,
        isActive: seedIngredient.isActive,
        ...audit,
      };

      return ingredient;
    });

    const savedIngredients = await Promise.all(
      ingredients.map((ingredient) =>
        this.ingredientsRepository.upsertIngredient(ingredient),
      ),
    );

    return {
      restaurantId,
      ingredientsCreated: savedIngredients.length,
      ingredients: savedIngredients,
    };
  }

  private buildListFilters(
    query: ListIngredientsQueryDto,
  ): IngredientListFilters {
    const filters: IngredientListFilters = {};

    if (query.category) {
      filters.category = query.category;
    }

    if (query.wasteRiskLevel) {
      filters.wasteRiskLevel = query.wasteRiskLevel;
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
      throw new BadRequestException('Ingredient name cannot be empty.');
    }

    return normalizedName;
  }

  private createNameKey(name: string): string {
    return createSlug(name);
  }

  private createIngredientId(
    restaurantId: string,
    nameKey: string,
  ): string {
    const safeRestaurantId = restaurantId.replace(/[^a-zA-Z0-9_]/g, '_');
    const safeNameKey = nameKey.replace(/-/g, '_');

    return `ingredient_${safeRestaurantId}_${safeNameKey}`;
  }

  private createDefaultLowStockThreshold(
    baseUnit: Ingredient['baseUnit']
  ): number {
    if (baseUnit === 'UNIT') {
      return 10;
    }

    return 500;
  }
}
