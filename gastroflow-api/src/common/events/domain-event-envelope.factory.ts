import { randomUUID } from 'crypto';
import type { DomainEventEnvelope } from './domain-event-envelope';

export function createDomainEventEnvelope<TPayload extends object>(input: {
  eventType: string;
  aggregateId: string;
  restaurantId: string;
  payload: TPayload;
  correlationId?: string;
  causationId?: string;
}): DomainEventEnvelope<TPayload> {
  const event: DomainEventEnvelope<TPayload> = {
    eventId: randomUUID(),
    eventType: input.eventType,
    aggregateId: input.aggregateId,
    restaurantId: input.restaurantId,
    occurredAt: new Date().toISOString(),
    version: 1,
    payload: input.payload
  };

  if (input.correlationId !== undefined) {
    event.correlationId = input.correlationId;
  }

  if (input.causationId !== undefined) {
    event.causationId = input.causationId;
  }

  return event;
}