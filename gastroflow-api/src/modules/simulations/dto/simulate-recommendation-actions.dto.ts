import { IsInt, IsOptional, Min } from 'class-validator';
import { RunSimulationDto } from './run-simulation.dto';

export class SimulateRecommendationActionsDto extends RunSimulationDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  maxRecommendations?: number;
}