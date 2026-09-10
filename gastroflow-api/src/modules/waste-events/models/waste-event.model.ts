import type { RestaurantScopedModel } from '../../../common/models/base.model';
import type { UnitOfMeasure } from '../../ingredients/models/ingredient.model';

export type WasteReason =
  | 'EXPIRED'
  | 'SPOILED'
  | 'DAMAGED'
  | 'OVERPRODUCED'
  | 'MANUAL_DISCARD';

export interface WasteEvent extends RestaurantScopedModel {
  inventoryBatchId: string;

  ingredientId: string;
  ingredientName: string;

  quantityWasted: number;
  unit: UnitOfMeasure;

  unitCost: number;
  totalCost: number;

  reason: WasteReason;

  occurredAt: string;

  stockMovementId: string;

  notes?: string;
}