import type { Transaction } from 'firebase-admin/firestore';
import type { DomainEventEnvelope } from '../../events/domain-event-envelope';
import type { OutboxEvent } from '../models/outbox-event.model';

export abstract class OutboxEventsRepository {
  abstract createOutboxEventInTransaction<TPayload extends object>(
    transaction: Transaction,
    event: DomainEventEnvelope<TPayload>
  ): OutboxEvent<TPayload>;

  abstract findPendingOutboxEvents(limit?: number): Promise<OutboxEvent[]>;

  abstract markOutboxEventPublished(
    outboxEventId: string,
    attempts: number,
    publishedAt: string
  ): Promise<void>;

  abstract markOutboxEventFailed(
    outboxEventId: string,
    attempts: number,
    lastAttemptAt: string,
    lastError: string,
    shouldRetry: boolean
  ): Promise<void>;
}