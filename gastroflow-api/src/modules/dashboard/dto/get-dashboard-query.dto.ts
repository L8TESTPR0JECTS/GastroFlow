import { IsOptional, IsString } from 'class-validator';

export class GetDashboardQueryDto {
  @IsOptional()
  @IsString()
  range?: string;
}