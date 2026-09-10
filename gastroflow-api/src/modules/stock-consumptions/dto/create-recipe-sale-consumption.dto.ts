import {
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateRecipeSaleConsumptionDto {
  @IsString()
  recipeId!: string;

  @IsInt()
  @Min(1)
  quantitySold!: number;

  @IsOptional()
  @IsString()
  notes?: string;
}