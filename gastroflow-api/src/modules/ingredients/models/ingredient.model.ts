import type { RestaurantScopedModel } from '../../../common/models/base.model';

export type IngredientCategory =
  | 'PROTEIN'
  | 'VEGETABLE'
  | 'DAIRY'
  | 'GRAIN'
  | 'BAKERY'
  | 'STARCH';

export type StorageType =
  | 'REFRIGERATED'
  | 'FROZEN'
  | 'DRY'
  | 'ROOM_TEMPERATURE';

export type UnitOfMeasure =
  | 'GRAM'
  | 'MILLILITER'
  | 'UNIT';

export type WasteRiskLevel =
  | 'LOW'
  | 'MEDIUM'
  | 'HIGH';

export type StockRotationStrategy = 'FIFO' | 'FEFO';

export interface Ingredient extends RestaurantScopedModel {
  name: string;
  nameKey: string;
  category: IngredientCategory;
  baseUnit: UnitOfMeasure;
  storageType: StorageType;
  averageShelfLifeDays: number;
  defaultCostPerUnit: number;
  wasteRiskLevel: WasteRiskLevel;
  recipeCoverageScore: number;
  stockRotationStrategy: StockRotationStrategy;
  lowStockThresholdQuantity: number;
  targetStockQuantity: number;
  iconKey: string;
  description: string;
  isActive: boolean;
}
