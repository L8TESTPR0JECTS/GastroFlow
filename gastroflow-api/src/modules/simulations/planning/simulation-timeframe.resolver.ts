import { BadRequestException } from '@nestjs/common';
import {
  addDaysToZonedDateParts,
  createUtcIsoFromZonedDateTime,
  getZonedDateParts,
  resolveTimeZone
} from '../../../common/utils/date.util';
import { SIMULATION_SCENARIO_CONFIGS } from '../config/simulation-scenario.config';
import type {
  SimulationPeriod,
  SimulationTimeframe,
  SimulationType
} from '../models/simulation.model';

export interface ResolvedSimulationTimeframe {
  timeframe: SimulationTimeframe;
  periods: SimulationPeriod[];
  durationDays: number;
}

export function resolveSimulationTimeframe(input: {
  simulationType: SimulationType;
  startsAt?: string;
  endsAt?: string;
  timezone?: string;
}): ResolvedSimulationTimeframe {
  const timezone = resolveTimeZone(input.timezone);

  if (input.simulationType === 'TIME_WINDOW') {
    return resolveCustomTimeWindow(input.startsAt, input.endsAt, timezone);
  }

  const scenario = SIMULATION_SCENARIO_CONFIGS[input.simulationType];

  if (!scenario) {
    const now = new Date();
    const endsAt = new Date(now);

    endsAt.setHours(now.getHours() + 1);

    return {
      timeframe: {
        startsAt: now.toISOString(),
        endsAt: endsAt.toISOString(),
        timezone
      },
      periods: ['AFTERNOON'],
      durationDays: 1
    };
  }

  const today = getZonedDateParts(new Date(), timezone);
  const endDay = addDaysToZonedDateParts({
    year: today.year,
    month: today.month,
    day: today.day,
    days: scenario.defaultDurationDays - 1
  });

  return {
    timeframe: {
      startsAt: createUtcIsoFromZonedDateTime({
        timezone,
        year: today.year,
        month: today.month,
        day: today.day,
        hour: 7
      }),
      endsAt: createUtcIsoFromZonedDateTime({
        timezone,
        year: endDay.year,
        month: endDay.month,
        day: endDay.day,
        hour: 23
      }),
      timezone
    },
    periods: scenario.defaultPeriods,
    durationDays: scenario.defaultDurationDays
  };
}

function resolveCustomTimeWindow(
  startsAt?: string,
  endsAt?: string,
  timezone?: string
): ResolvedSimulationTimeframe {
  if (!startsAt || !endsAt) {
    throw new BadRequestException(
      'TIME_WINDOW simulations require startsAt and endsAt.'
    );
  }

  const startDate = new Date(startsAt);
  const endDate = new Date(endsAt);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    throw new BadRequestException('startsAt and endsAt must be valid ISO dates.');
  }

  if (endDate <= startDate) {
    throw new BadRequestException('endsAt must be after startsAt.');
  }

  return {
    timeframe: {
      startsAt: startDate.toISOString(),
      endsAt: endDate.toISOString(),
      timezone: resolveTimeZone(timezone)
    },
    periods: resolvePeriodsForTimeWindow(
      startDate,
      endDate,
      resolveTimeZone(timezone)
    ),
    durationDays: calculateDurationDays(startDate, endDate)
  };
}

function resolvePeriodsForTimeWindow(
  startDate: Date,
  endDate: Date,
  timezone: string
): SimulationPeriod[] {
  const periods = new Set<SimulationPeriod>();
  const cursor = new Date(startDate);

  while (cursor <= endDate) {
    const hour = getZonedDateParts(cursor, timezone).hour;

    if (hour >= 7 && hour < 9) {
      periods.add('OPENING');
    } else if (hour >= 9 && hour < 11) {
      periods.add('MORNING_PREP');
    } else if (hour >= 11 && hour < 14) {
      periods.add('LUNCH');
    } else if (hour >= 14 && hour < 17) {
      periods.add('AFTERNOON');
    } else if (hour >= 17 && hour < 21) {
      periods.add('DINNER');
    } else if (hour >= 21 && hour < 23) {
      periods.add('CLOSING');
    }

    cursor.setUTCHours(cursor.getUTCHours() + 1);
  }

  return Array.from(periods);
}

function calculateDurationDays(startDate: Date, endDate: Date): number {
  const dayMs = 24 * 60 * 60 * 1000;

  return Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / dayMs));
}
