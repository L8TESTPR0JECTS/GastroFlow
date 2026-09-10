import type { WasteReason } from '../models/waste-event.model';

export interface WasteRecordedEventPayload {
  wasteEventId: string;
  stockMovementId: string;
  inventoryBatchId: string;
  ingredientId: string;
  ingredientName: string;
  quantityWasted: number;
  totalCost: number;
  reason: WasteReason;
}