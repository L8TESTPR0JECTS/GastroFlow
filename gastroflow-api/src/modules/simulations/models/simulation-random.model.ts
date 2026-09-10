import type { SimulationIntensity } from './simulation.model';

export interface SimulationRandomContext {
  intensity: SimulationIntensity;
  random: () => number;
}

export interface WeightedOption<TValue> {
  value: TValue;
  weight: number;
}