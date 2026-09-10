import { IsOptional, IsString } from 'class-validator';

export class GenerateRecommendationsDto {
  @IsOptional()
  @IsString()
  notes?: string;
}