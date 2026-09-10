import { IsIn, IsOptional, IsString } from 'class-validator';
import type { RestaurantStatus } from '../models/restaurant.model';

export class UpdateRestaurantDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsIn(['ACTIVE', 'INACTIVE'])
  status?: RestaurantStatus;
}