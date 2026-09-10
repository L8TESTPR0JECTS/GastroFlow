import {
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import type { WasteReason } from '../models/waste-event.model';

export class CreateWasteEventDto {
  @IsString()
  inventoryBatchId!: string;

  @IsNumber()
  @Min(0.0001)
  quantityWasted!: number;

  @IsIn(['EXPIRED', 'SPOILED', 'DAMAGED', 'OVERPRODUCED', 'MANUAL_DISCARD'])
  reason!: WasteReason;

  @IsOptional()
  @IsString()
  notes?: string;
}