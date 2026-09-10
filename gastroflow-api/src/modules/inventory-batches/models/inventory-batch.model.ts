import type { RestaurantScopedModel } from '../../../common/models/base.model';
import type { UnitOfMeasure } from '../../ingredients/models/ingredient.model';

export type InventoryBatchStatus =
  | 'AVAILABLE'
  | 'PARTIALLY_USED'
  | 'DEPLETED'
  | 'EXPIRED'
  | 'WASTED';

export interface InventoryBatch extends RestaurantScopedModel {
  ingredientId: string;
  ingredientName: string;
  locationId: string;

  quantityReceived: number;
  quantityAvailable: number;
  unit: UnitOfMeasure;

  unitCost: number;
  totalCost: number;

  receivedAt: string;
  expiresAt: string;

  status: InventoryBatchStatus;
  isActive: boolean;

  notes?: string;
}