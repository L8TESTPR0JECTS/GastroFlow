export interface DomainEventEnvelope<TPayload extends object = object> {
  eventId: string;
  eventType: string;
  aggregateId: string;
  restaurantId: string;
  occurredAt: string;
  version: number;
  correlationId?: string;
  causationId?: string;
  payload: TPayload;
}