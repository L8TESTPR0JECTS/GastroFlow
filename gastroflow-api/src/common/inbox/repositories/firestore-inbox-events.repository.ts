import { Inject, Injectable } from '@nestjs/common';
import type { Firestore, Transaction } from 'firebase-admin/firestore';

import { FIRESTORE } from '../../firestore/firestore.constants';
import type { InboxEvent } from '../models/inbox-event.model';
import { InboxEventsRepository } from './inbox-events.repository';

@Injectable()
export class FirestoreInboxEventsRepository extends InboxEventsRepository {
  private readonly collectionName = 'inbox_events';

  constructor(
    @Inject(FIRESTORE)
    private readonly firestore: Firestore
  ) {
    super();
  }

  async existsInTransaction(
    transaction: Transaction,
    eventId: string
  ): Promise<boolean> {
    const ref = this.firestore
      .collection(this.collectionName)
      .doc(eventId);

    const snapshot = await transaction.get(ref);

    return snapshot.exists;
  }

  createInboxEventInTransaction(
    transaction: Transaction,
    inboxEvent: InboxEvent
  ): void {
    const ref = this.firestore
      .collection(this.collectionName)
      .doc(inboxEvent.id);

    transaction.create(ref, inboxEvent);
  }
}