export type SimulationType =
  | 'TIME_WINDOW'
  | 'OPENING_TO_NOON'
  | 'LUNCH_RUSH'
  | 'AFTERNOON_SLOWDOWN'
  | 'DINNER_RUSH'
  | 'FULL_DAY'
  | 'MULTI_DAY'
  | 'WEEK'
  | 'SUPPLIER_DELIVERY'
  | 'WASTE_SPIKE'
  | 'OVERBUYING'
  | 'FOLLOW_RECOMMENDATIONS'
  | 'IGNORE_RECOMMENDATIONS';

export type SimulationIntensity =
  | 'QUIET'
  | 'NORMAL'
  | 'BUSY'
  | 'CHAOS';

export type SimulationPeriod =
  | 'OPENING'
  | 'MORNING_PREP'
  | 'LUNCH'
  | 'AFTERNOON'
  | 'DINNER'
  | 'CLOSING';

export interface SimulationTimeframe {
  startsAt: string;
  endsAt: string;
  timezone: string;
}

export interface SimulationAction {
  type: string;
  description: string;
  occurredAt: string;
  entityId?: string;
  entityName?: string;
  quantity?: number;
  metadata?: Record<string, unknown>;
}

export interface SimulationSummary {
  timelineEventCount: number;
  stockConsumptionCount: number;
  wasteEventCount: number;
  inventoryBatchCount: number;
  recommendationsAppliedCount: number;
  recommendationsDismissedCount: number;
  recommendationsGeneratedCount: number;
  quietPeriodCount: number;
  rushSpikeCount: number;
  totalEstimatedSales: number;
  totalWasteCost: number;
}

export interface SimulationResult {
  restaurantId: string;
  simulationType: SimulationType;
  intensity: SimulationIntensity;
  timeframe: SimulationTimeframe;
  seed?: string;
  startedAt: string;
  completedAt: string;
  timeline: SimulationTimelineEvent[];
  actions: SimulationAction[];
  summary: SimulationSummary;
}

export type SimulationTimelineEventType =
  | 'RECIPE_SALE'
  | 'SUPPLIER_DELIVERY'
  | 'WASTE_EVENT'
  | 'RECOMMENDATION_GENERATION'
  | 'RECOMMENDATION_APPLIED'
  | 'RECOMMENDATION_DISMISSED'
  | 'QUIET_PERIOD'
  | 'RUSH_SPIKE';

export interface SimulationTimelineEvent {
  id: string;
  eventType: SimulationTimelineEventType;
  scheduledAt: string;
  period: SimulationPeriod;
  description: string;
  metadata?: Record<string, unknown>;
}
