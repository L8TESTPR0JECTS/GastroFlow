import { IsIn, IsOptional, IsString } from 'class-validator';
import type {
  SimulationIntensity,
  SimulationType
} from '../models/simulation.model';

export class RunSimulationDto {
  @IsOptional()
  @IsIn([
    'TIME_WINDOW',
    'OPENING_TO_NOON',
    'LUNCH_RUSH',
    'AFTERNOON_SLOWDOWN',
    'DINNER_RUSH',
    'FULL_DAY',
    'MULTI_DAY',
    'WEEK',
    'SUPPLIER_DELIVERY',
    'WASTE_SPIKE',
    'OVERBUYING',
    'FOLLOW_RECOMMENDATIONS',
    'IGNORE_RECOMMENDATIONS'
  ])
  simulationType?: SimulationType;

  @IsOptional()
  @IsIn(['QUIET', 'NORMAL', 'BUSY', 'CHAOS'])
  intensity?: SimulationIntensity;

  @IsOptional()
  @IsString()
  startsAt?: string;

  @IsOptional()
  @IsString()
  endsAt?: string;

  @IsOptional()
  @IsString()
  seed?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}