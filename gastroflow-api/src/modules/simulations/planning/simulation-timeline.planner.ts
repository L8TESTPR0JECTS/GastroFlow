import { randomUUID } from 'crypto';
import {
  addDaysToZonedDateParts,
  createUtcIsoFromZonedDateTime,
  getZonedDateParts
} from '../../../common/utils/date.util';
import { SIMULATION_INTENSITY_CONFIGS } from '../config/simulation-intensity.config';
import { SIMULATION_PERIOD_CONFIGS } from '../config/simulation-period.config';
import type {
  SimulationIntensity,
  SimulationPeriod,
  SimulationTimelineEvent,
  SimulationTimelineEventType,
  SimulationTimeframe,
  SimulationType
} from '../models/simulation.model';
import {
  pickWeightedOption,
  randomIntegerBetween
} from './simulation-random.util';

export interface SimulationTimelinePlanInput {
  simulationType: SimulationType;
  timeframe: SimulationTimeframe;
  periods: SimulationPeriod[];
  durationDays: number;
  intensity: SimulationIntensity;
  random: () => number;
}

export function planSimulationTimeline(
  input: SimulationTimelinePlanInput
): SimulationTimelineEvent[] {
  const timeline: SimulationTimelineEvent[] = [];
  const intensityConfig = SIMULATION_INTENSITY_CONFIGS[input.intensity];

  for (let dayIndex = 0; dayIndex < input.durationDays; dayIndex += 1) {
    for (const period of input.periods) {
      const periodConfig = SIMULATION_PERIOD_CONFIGS[period];
      const eventTypeWeights = getScenarioEventTypeWeights(
        input.simulationType,
        periodConfig.eventTypeWeights
      );

      const eventCount = randomIntegerBetween(
        input.random,
        intensityConfig.minTimelineEventsPerPeriod,
        intensityConfig.maxTimelineEventsPerPeriod
      );

      for (let eventIndex = 0; eventIndex < eventCount; eventIndex += 1) {
        const eventType = pickWeightedOption(input.random, eventTypeWeights);

        timeline.push({
          id: `simulation_event_${randomUUID()}`,
          eventType,
          scheduledAt: createScheduledAt({
            timeframe: input.timeframe,
            dayIndex,
            startsAtHour: periodConfig.startsAtHour,
            endsAtHour: periodConfig.endsAtHour,
            random: input.random
          }),
          period,
          description: createTimelineEventDescription(eventType, period)
        });
      }
    }
  }

  addRequiredScenarioEvents(timeline, input);

  return timeline.sort((a, b) => {
    return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
  });
}

function getScenarioEventTypeWeights(
  simulationType: SimulationType,
  fallback: { value: SimulationTimelineEventType; weight: number }[]
): { value: SimulationTimelineEventType; weight: number }[] {
  switch (simulationType) {
    case 'SUPPLIER_DELIVERY':
      return [
        { value: 'SUPPLIER_DELIVERY', weight: 7 },
        { value: 'QUIET_PERIOD', weight: 2 },
        { value: 'RECOMMENDATION_GENERATION', weight: 1 }
      ];
    case 'WASTE_SPIKE':
      return [
        { value: 'WASTE_EVENT', weight: 7 },
        { value: 'QUIET_PERIOD', weight: 2 },
        { value: 'RECOMMENDATION_GENERATION', weight: 1 }
      ];
    case 'OVERBUYING':
      return [
        { value: 'SUPPLIER_DELIVERY', weight: 8 },
        { value: 'QUIET_PERIOD', weight: 2 }
      ];
    case 'FOLLOW_RECOMMENDATIONS':
      return [
        { value: 'RECOMMENDATION_GENERATION', weight: 4 },
        { value: 'RECOMMENDATION_APPLIED', weight: 5 },
        { value: 'QUIET_PERIOD', weight: 1 }
      ];
    case 'IGNORE_RECOMMENDATIONS':
      return [
        { value: 'RECOMMENDATION_GENERATION', weight: 4 },
        { value: 'RECOMMENDATION_DISMISSED', weight: 5 },
        { value: 'QUIET_PERIOD', weight: 1 }
      ];
    default:
      return fallback;
  }
}

function getRequiredScenarioEventTypes(
  simulationType: SimulationType
): SimulationTimelineEventType[] {
  switch (simulationType) {
    case 'SUPPLIER_DELIVERY':
    case 'OVERBUYING':
      return ['SUPPLIER_DELIVERY'];
    case 'WASTE_SPIKE':
      return ['WASTE_EVENT'];
    case 'FOLLOW_RECOMMENDATIONS':
      return ['RECOMMENDATION_GENERATION', 'RECOMMENDATION_APPLIED'];
    case 'IGNORE_RECOMMENDATIONS':
      return ['RECOMMENDATION_GENERATION', 'RECOMMENDATION_DISMISSED'];
    default:
      return [];
  }
}

function addRequiredScenarioEvents(
  timeline: SimulationTimelineEvent[],
  input: SimulationTimelinePlanInput
): void {
  const requiredEventTypes = getRequiredScenarioEventTypes(input.simulationType);
  const alwaysAddSequence =
    input.simulationType === 'FOLLOW_RECOMMENDATIONS' ||
    input.simulationType === 'IGNORE_RECOMMENDATIONS';

  requiredEventTypes.forEach((eventType, index) => {
    if (!alwaysAddSequence && timeline.some((event) => event.eventType === eventType)) {
      return;
    }

    const period = input.periods[0] ?? 'AFTERNOON';

    timeline.push({
      id: `simulation_event_${randomUUID()}`,
      eventType,
      scheduledAt: createRequiredScheduledAt({
        timeframe: input.timeframe,
        period,
        sequenceIndex: index
      }),
      period,
      description: createTimelineEventDescription(eventType, period),
      metadata: {
        requiredScenarioEvent: true
      }
    });
  });
}

function createScheduledAt(input: {
  timeframe: SimulationTimeframe;
  dayIndex: number;
  startsAtHour: number;
  endsAtHour: number;
  random: () => number;
}): string {
  const startDate = getZonedDateParts(
    new Date(input.timeframe.startsAt),
    input.timeframe.timezone
  );
  const scheduledDate = addDaysToZonedDateParts({
    year: startDate.year,
    month: startDate.month,
    day: startDate.day,
    days: input.dayIndex
  });
  const hour = randomIntegerBetween(input.random, input.startsAtHour, input.endsAtHour - 1);
  const minute = randomIntegerBetween(input.random, 0, 59);

  return createUtcIsoFromZonedDateTime({
    timezone: input.timeframe.timezone,
    year: scheduledDate.year,
    month: scheduledDate.month,
    day: scheduledDate.day,
    hour,
    minute
  });
}

function createRequiredScheduledAt(input: {
  timeframe: SimulationTimeframe;
  period: SimulationPeriod;
  sequenceIndex: number;
}): string {
  const periodConfig = SIMULATION_PERIOD_CONFIGS[input.period];
  const startDate = getZonedDateParts(
    new Date(input.timeframe.startsAt),
    input.timeframe.timezone
  );
  const hour = Math.min(
    periodConfig.startsAtHour + Math.floor(input.sequenceIndex / 6),
    periodConfig.endsAtHour - 1
  );
  const minute = (input.sequenceIndex % 6) * 10;

  return createUtcIsoFromZonedDateTime({
    timezone: input.timeframe.timezone,
    year: startDate.year,
    month: startDate.month,
    day: startDate.day,
    hour,
    minute
  });
}

function createTimelineEventDescription(
  eventType: SimulationTimelineEventType,
  period: SimulationPeriod
): string {
  switch (eventType) {
    case 'RECIPE_SALE':
      return `Recipe sale activity during ${period}.`;
    case 'SUPPLIER_DELIVERY':
      return `Supplier delivery activity during ${period}.`;
    case 'WASTE_EVENT':
      return `Waste risk event during ${period}.`;
    case 'RECOMMENDATION_GENERATION':
      return `Recommendation refresh during ${period}.`;
    case 'RECOMMENDATION_APPLIED':
      return `Recommendation applied during ${period}.`;
    case 'RECOMMENDATION_DISMISSED':
      return `Recommendation dismissed during ${period}.`;
    case 'QUIET_PERIOD':
      return `Quiet period during ${period}.`;
    case 'RUSH_SPIKE':
      return `Rush spike during ${period}.`;
  }
}
