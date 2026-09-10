import { Injectable, Logger } from '@nestjs/common';
import type { DomainEventEnvelope } from './domain-event-envelope';
import type { DomainEventsPublisher } from './domain-events-publisher';

@Injectable()
export class LocalDomainEventsPublisher implements DomainEventsPublisher {
  private readonly logger = new Logger(LocalDomainEventsPublisher.name);

async publish(
  event: DomainEventEnvelope<object>
): Promise<void> {
  throw new Error(
    `Simulated publisher failure for ${event.eventType}`
  );
}
}