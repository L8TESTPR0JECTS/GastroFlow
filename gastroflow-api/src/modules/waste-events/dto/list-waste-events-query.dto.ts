import {
  IsIn,
  IsOptional,
  IsString,
} from 'class-validator';
import type { WasteReason } from '../models/waste-event.model';

export class ListWasteEventsQueryDto {
  @IsOptional()
  @IsString()
  ingredientId?: string;

  @IsOptional()
  @IsString()
  inventoryBatchId?: string;

  @IsOptional()
  @IsIn(['EXPIRED', 'SPOILED', 'DAMAGED', 'OVERPRODUCED', 'MANUAL_DISCARD'])
  reason?: WasteReason;
}