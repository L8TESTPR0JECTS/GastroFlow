import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import type { RestaurantLocationType } from '../models/restaurant-location.model';


export class CreateLocationDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsIn(['KITCHEN', 'STORE', 'WAREHOUSE'])
  type?: RestaurantLocationType;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}