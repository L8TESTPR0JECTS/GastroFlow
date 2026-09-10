import { Inject, Injectable } from "@nestjs/common";
import { OutboxEventsRepository } from "./outbox-events.repository";
import { FIRESTORE } from "src/common/firestore/firestore.constants";
import { Firestore, Transaction } from "firebase-admin/firestore";
import { DomainEventEnvelope } from "src/common/events/domain-event-envelope";
import { OutboxEvent } from "../models/outbox-event.model";
import { nowIso } from "src/common/utils/date.util";

@Injectable()
export class FirestoreOutboxEventsRepository extends OutboxEventsRepository {

  private readonly collectionName = 'outbox_events';

  constructor(
    @Inject(FIRESTORE)
    private readonly firestore: Firestore
  ) {
    super();
  }

  createOutboxEventInTransaction<TPayload extends object>(
    transaction: Transaction,
    event: DomainEventEnvelope<TPayload>
  ): OutboxEvent<TPayload> {
    const outboxEvent: OutboxEvent<TPayload> = {
      id: event.eventId,
      event,
      status: 'PENDING',
      attempts: 0,
      createdAt: nowIso()
    };

    const ref = this.firestore
      .collection('outbox_events')
      .doc(outboxEvent.id);

    transaction.create(ref, outboxEvent);

    return outboxEvent;
  }

  async findPendingOutboxEvents(
    limit = 25
  ): Promise<OutboxEvent[]> {
    const snapshot = await this.firestore
      .collection(this.collectionName)
      .where('status', '==', 'PENDING')
      .limit(limit)
      .get();

    return snapshot.docs.map((doc) => doc.data() as OutboxEvent);
  }

  async markOutboxEventPublished(
    outboxEventId: string,
    attempts: number,
    publishedAt: string
  ): Promise<void> {
    await this.firestore
      .collection(this.collectionName)
      .doc(outboxEventId)
      .update({
        status: 'PUBLISHED',
        attempts,
        publishedAt,
        lastAttemptAt: publishedAt
      });
  }

  async markOutboxEventFailed(
    outboxEventId: string,
    attempts: number,
    lastAttemptAt: string,
    lastError: string,
    shouldRetry: boolean
  ): Promise<void> {
    await this.firestore
      .collection(this.collectionName)
      .doc(outboxEventId)
      .update({
        status: shouldRetry ? 'PENDING' : 'FAILED',
        attempts,
        lastAttemptAt,
        lastError
      });
  }

}