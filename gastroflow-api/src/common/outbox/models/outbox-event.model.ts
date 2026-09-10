import type { DomainEventEnvelope } from '../../events/domain-event-envelope';

export type OutboxEventStatus =
  | 'PENDING'
  | 'PUBLISHED'
  | 'FAILED';

export interface OutboxEvent<TPayload extends object = object> {
  id: string;
  event: DomainEventEnvelope<TPayload>;
  status: OutboxEventStatus;

  attempts: number;
  createdAt: string;
  publishedAt?: string;
  lastAttemptAt?: string;
  lastError?: string;
}