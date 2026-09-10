import type { SimulationIntensity } from '../models/simulation.model';

export interface SimulationIntensityConfig {
  intensity: SimulationIntensity;
  minTimelineEventsPerPeriod: number;
  maxTimelineEventsPerPeriod: number;
  salesMultiplier: number;
  wasteMultiplier: number;
  deliveryMultiplier: number;
  recommendationMultiplier: number;
}

export const SIMULATION_INTENSITY_CONFIGS: Record<SimulationIntensity, SimulationIntensityConfig> = {
  QUIET: {
    intensity: 'QUIET',
    minTimelineEventsPerPeriod: 1,
    maxTimelineEventsPerPeriod: 2,
    salesMultiplier: 0.5,
    wasteMultiplier: 0.5,
    deliveryMultiplier: 0.75,
    recommendationMultiplier: 0.5
  },
  NORMAL: {
    intensity: 'NORMAL',
    minTimelineEventsPerPeriod: 2,
    maxTimelineEventsPerPeriod: 4,
    salesMultiplier: 1,
    wasteMultiplier: 1,
    deliveryMultiplier: 1,
    recommendationMultiplier: 1
  },
  BUSY: {
    intensity: 'BUSY',
    minTimelineEventsPerPeriod: 4,
    maxTimelineEventsPerPeriod: 7,
    salesMultiplier: 1.6,
    wasteMultiplier: 1.3,
    deliveryMultiplier: 1,
    recommendationMultiplier: 1.4
  },
  CHAOS: {
    intensity: 'CHAOS',
    minTimelineEventsPerPeriod: 7,
    maxTimelineEventsPerPeriod: 12,
    salesMultiplier: 2.5,
    wasteMultiplier: 2,
    deliveryMultiplier: 1.2,
    recommendationMultiplier: 1.8
  }
};