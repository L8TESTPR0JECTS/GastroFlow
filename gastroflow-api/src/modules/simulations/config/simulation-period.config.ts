import type {
  SimulationPeriod,
  SimulationTimelineEventType
} from '../models/simulation.model';
import type { WeightedOption } from '../models/simulation-random.model';

export interface SimulationPeriodConfig {
  period: SimulationPeriod;
  startsAtHour: number;
  endsAtHour: number;
  eventTypeWeights: WeightedOption<SimulationTimelineEventType>[];
}

export const SIMULATION_PERIOD_CONFIGS: Record<SimulationPeriod, SimulationPeriodConfig> = {
  OPENING: {
    period: 'OPENING',
    startsAtHour: 7,
    endsAtHour: 9,
    eventTypeWeights: [
      { value: 'SUPPLIER_DELIVERY', weight: 4 },
      { value: 'QUIET_PERIOD', weight: 4 },
      { value: 'WASTE_EVENT', weight: 1 },
      { value: 'RECOMMENDATION_GENERATION', weight: 1 }
    ]
  },
  MORNING_PREP: {
    period: 'MORNING_PREP',
    startsAtHour: 9,
    endsAtHour: 11,
    eventTypeWeights: [
      { value: 'SUPPLIER_DELIVERY', weight: 2 },
      { value: 'QUIET_PERIOD', weight: 4 },
      { value: 'WASTE_EVENT', weight: 2 },
      { value: 'RECOMMENDATION_GENERATION', weight: 1 },
      { value: 'RECIPE_SALE', weight: 1 }
    ]
  },
  LUNCH: {
    period: 'LUNCH',
    startsAtHour: 11,
    endsAtHour: 14,
    eventTypeWeights: [
      { value: 'RECIPE_SALE', weight: 8 },
      { value: 'RUSH_SPIKE', weight: 3 },
      { value: 'WASTE_EVENT', weight: 2 },
      { value: 'RECOMMENDATION_GENERATION', weight: 2 },
      { value: 'QUIET_PERIOD', weight: 1 }
    ]
  },
  AFTERNOON: {
    period: 'AFTERNOON',
    startsAtHour: 14,
    endsAtHour: 17,
    eventTypeWeights: [
      { value: 'QUIET_PERIOD', weight: 6 },
      { value: 'RECIPE_SALE', weight: 2 },
      { value: 'WASTE_EVENT', weight: 3 },
      { value: 'RECOMMENDATION_GENERATION', weight: 3 }
    ]
  },
  DINNER: {
    period: 'DINNER',
    startsAtHour: 17,
    endsAtHour: 21,
    eventTypeWeights: [
      { value: 'RECIPE_SALE', weight: 7 },
      { value: 'RUSH_SPIKE', weight: 3 },
      { value: 'WASTE_EVENT', weight: 2 },
      { value: 'RECOMMENDATION_GENERATION', weight: 2 },
      { value: 'QUIET_PERIOD', weight: 1 }
    ]
  },
  CLOSING: {
    period: 'CLOSING',
    startsAtHour: 21,
    endsAtHour: 23,
    eventTypeWeights: [
      { value: 'WASTE_EVENT', weight: 5 },
      { value: 'RECOMMENDATION_GENERATION', weight: 4 },
      { value: 'QUIET_PERIOD', weight: 3 }
    ]
  }
};