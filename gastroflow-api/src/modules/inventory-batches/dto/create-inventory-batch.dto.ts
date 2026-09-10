import {
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateInventoryBatchDto {
  @IsString()
  ingredientId!: string;

  @IsString()
  locationId!: string;

  @IsNumber()
  @Min(0.0001)
  quantityReceived!: number;

  @IsNumber()
  @Min(0)
  unitCost!: number;

  @IsOptional()
  @IsISO8601()
  receivedAt?: string;

  @IsOptional()
  @IsISO8601()
  expiresAt?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}