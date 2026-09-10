import { Injectable } from '@nestjs/common';
import { createSeededRandom } from './planning/simulation-random.util';
import { planSimulationTimeline } from './planning/simulation-timeline.planner';
import { resolveSimulationTimeframe } from './planning/simulation-timeframe.resolver';
import type { RunSimulationDto } from './dto/run-simulation.dto';
import type {
  SimulationIntensity,
  SimulationResult,
  SimulationType
} from './models/simulation.model';

@Injectable()
export class SimulationPlanningService {
  planSimulation(
    restaurantId: string,
    dto: RunSimulationDto,
    timezone?: string
  ): SimulationResult {
    const simulationType: SimulationType = dto.simulationType ?? 'FULL_DAY';
    const intensity: SimulationIntensity = dto.intensity ?? this.pickDefaultIntensity(simulationType);
    const random = createSeededRandom(dto.seed);

    const resolved = resolveSimulationTimeframe({
      simulationType,
      startsAt: dto.startsAt,
      endsAt: dto.endsAt,
      timezone
    });

    const timeline = planSimulationTimeline({
      simulationType,
      timeframe: resolved.timeframe,
      periods: resolved.periods,
      durationDays: resolved.durationDays,
      intensity,
      random
    });

    const now = new Date().toISOString();

    return {
      restaurantId,
      simulationType,
      intensity,
      timeframe: resolved.timeframe,
      seed: dto.seed,
      startedAt: now,
      completedAt: now,
      timeline,
      actions: [],
      summary: {
        timelineEventCount: timeline.length,
        stockConsumptionCount: 0,
        wasteEventCount: 0,
        inventoryBatchCount: 0,
        recommendationsAppliedCount: 0,
        recommendationsDismissedCount: 0,
        recommendationsGeneratedCount: 0,
        quietPeriodCount: timeline.filter((event) => event.eventType === 'QUIET_PERIOD').length,
        rushSpikeCount: timeline.filter((event) => event.eventType === 'RUSH_SPIKE').length,
        totalEstimatedSales: 0,
        totalWasteCost: 0
      }
    };
  }

  private pickDefaultIntensity(simulationType: SimulationType): SimulationIntensity {
    if (simulationType === 'LUNCH_RUSH' || simulationType === 'DINNER_RUSH') {
      return 'BUSY';
    }

    if (simulationType === 'WEEK') {
      return 'NORMAL';
    }

    return 'NORMAL';
  }
}
