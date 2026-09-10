import {
  IsBooleanString,
  IsIn,
  IsOptional,
  IsString,
} from 'class-validator';
import type { InventoryBatchStatus } from '../models/inventory-batch.model';

export class ListInventoryBatchesQueryDto {
  @IsOptional()
  @IsString()
  ingredientId?: string;

  @IsOptional()
  @IsString()
  locationId?: string;

  @IsOptional()
  @IsIn(['AVAILABLE', 'PARTIALLY_USED', 'DEPLETED', 'EXPIRED', 'WASTED'])
  status?: InventoryBatchStatus;

  @IsOptional()
  @IsBooleanString()
  isActive?: string;
}