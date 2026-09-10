import type { Transaction } from 'firebase-admin/firestore';
import type { DomainEventEnvelope } from './domain-event-envelope';

export interface DomainEventHandler<
  TPayload extends object = object
> {
  eventType: string;

  handle(
    transaction: Transaction,
    event: DomainEventEnvelope<TPayload>
  ): Promise<void>;
}