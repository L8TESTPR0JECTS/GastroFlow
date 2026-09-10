import type {
  SimulationPeriod,
  SimulationType
} from '../models/simulation.model';

export interface SimulationScenarioConfig {
  simulationType: SimulationType;
  defaultPeriods: SimulationPeriod[];
  defaultDurationDays: number;
}

export const SIMULATION_SCENARIO_CONFIGS: Partial<Record<SimulationType, SimulationScenarioConfig>> = {
  OPENING_TO_NOON: {
    simulationType: 'OPENING_TO_NOON',
    defaultPeriods: ['OPENING', 'MORNING_PREP', 'LUNCH'],
    defaultDurationDays: 1
  },
  LUNCH_RUSH: {
    simulationType: 'LUNCH_RUSH',
    defaultPeriods: ['LUNCH'],
    defaultDurationDays: 1
  },
  AFTERNOON_SLOWDOWN: {
    simulationType: 'AFTERNOON_SLOWDOWN',
    defaultPeriods: ['AFTERNOON'],
    defaultDurationDays: 1
  },
  DINNER_RUSH: {
    simulationType: 'DINNER_RUSH',
    defaultPeriods: ['DINNER'],
    defaultDurationDays: 1
  },
  FULL_DAY: {
    simulationType: 'FULL_DAY',
    defaultPeriods: ['OPENING', 'MORNING_PREP', 'LUNCH', 'AFTERNOON', 'DINNER', 'CLOSING'],
    defaultDurationDays: 1
  },
  MULTI_DAY: {
    simulationType: 'MULTI_DAY',
    defaultPeriods: ['OPENING', 'MORNING_PREP', 'LUNCH', 'AFTERNOON', 'DINNER', 'CLOSING'],
    defaultDurationDays: 3
  },
  WEEK: {
    simulationType: 'WEEK',
    defaultPeriods: ['OPENING', 'MORNING_PREP', 'LUNCH', 'AFTERNOON', 'DINNER', 'CLOSING'],
    defaultDurationDays: 7
  },
  SUPPLIER_DELIVERY: {
    simulationType: 'SUPPLIER_DELIVERY',
    defaultPeriods: ['OPENING', 'MORNING_PREP'],
    defaultDurationDays: 1
  },
  WASTE_SPIKE: {
    simulationType: 'WASTE_SPIKE',
    defaultPeriods: ['AFTERNOON', 'CLOSING'],
    defaultDurationDays: 1
  },
  OVERBUYING: {
    simulationType: 'OVERBUYING',
    defaultPeriods: ['OPENING', 'MORNING_PREP'],
    defaultDurationDays: 1
  },
  FOLLOW_RECOMMENDATIONS: {
    simulationType: 'FOLLOW_RECOMMENDATIONS',
    defaultPeriods: ['AFTERNOON', 'CLOSING'],
    defaultDurationDays: 1
  },
  IGNORE_RECOMMENDATIONS: {
    simulationType: 'IGNORE_RECOMMENDATIONS',
    defaultPeriods: ['AFTERNOON', 'CLOSING'],
    defaultDurationDays: 1
  }
};
