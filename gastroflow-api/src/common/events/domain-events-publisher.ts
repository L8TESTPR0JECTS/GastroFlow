import type { DomainEventEnvelope } from './domain-event-envelope';

export interface DomainEventsPublisher {
  publish<TPayload extends object>(
    event: DomainEventEnvelope<TPayload>
  ): Promise<void>;
}

export const DOMAIN_EVENTS_PUBLISHER = Symbol('DOMAIN_EVENTS_PUBLISHER');