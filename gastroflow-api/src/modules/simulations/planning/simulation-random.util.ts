import type { WeightedOption } from '../models/simulation-random.model';

export function createSeededRandom(seed?: string): () => number {
  if (!seed) {
    return Math.random;
  }

  let hash = 0;

  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(index);
    hash |= 0;
  }

  let state = Math.abs(hash) || 1;

  return () => {
    state = (state * 16807) % 2147483647;

    return (state - 1) / 2147483646;
  };
}

export function randomIntegerBetween(
  random: () => number,
  min: number,
  max: number
): number {
  return Math.floor(random() * (max - min + 1)) + min;
}

export function randomBoolean(random: () => number, chance: number): boolean {
  return random() < chance;
}

export function pickWeightedOption<TValue>(
  random: () => number,
  options: WeightedOption<TValue>[]
): TValue {
  const totalWeight = options.reduce((total, option) => total + option.weight, 0);
  const target = random() * totalWeight;

  let runningWeight = 0;

  for (const option of options) {
    runningWeight += option.weight;

    if (target <= runningWeight) {
      return option.value;
    }
  }

  return options[options.length - 1].value;
}

export function pickRandomItem<TValue>(
  random: () => number,
  items: TValue[]
): TValue {
  return items[randomIntegerBetween(random, 0, items.length - 1)];
}