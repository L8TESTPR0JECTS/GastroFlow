import type { Transaction } from 'firebase-admin/firestore';
import type { InboxEvent } from '../models/inbox-event.model';

export abstract class InboxEventsRepository {
  abstract existsInTransaction(
    transaction: Transaction,
    eventId: string
  ): Promise<boolean>;

  abstract createInboxEventInTransaction(
    transaction: Transaction,
    inboxEvent: InboxEvent
  ): void;
}