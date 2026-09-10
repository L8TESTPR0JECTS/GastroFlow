import {
  IsBoolean,
  IsISO8601,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import type { InventoryBatchStatus } from '../models/inventory-batch.model';

export class UpdateInventoryBatchDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  quantityAvailable?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  unitCost?: number;

  @IsOptional()
  @IsISO8601()
  receivedAt?: string;

  @IsOptional()
  @IsISO8601()
  expiresAt?: string;

  @IsOptional()
  @IsIn(['AVAILABLE', 'PARTIALLY_USED', 'DEPLETED', 'EXPIRED', 'WASTED'])
  status?: InventoryBatchStatus;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;
}