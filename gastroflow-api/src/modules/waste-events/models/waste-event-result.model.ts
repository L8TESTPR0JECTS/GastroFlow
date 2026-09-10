import type { StockMovement } from '../../stock-consumptions/models/stock-movement.model';
import type { WasteEvent } from './waste-event.model';

export interface WasteEventResult {
  restaurantId: string;

  wasteEvent: WasteEvent;
  stockMovement: StockMovement;

  remainingQuantityAvailable: number;
  inventoryBatchStatus: string;
}