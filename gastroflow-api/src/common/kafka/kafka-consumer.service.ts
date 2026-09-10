import {
  Inject,
  Injectable,
  Logger,
  OnApplicationShutdown,
  OnModuleInit
} from '@nestjs/common';
import type { Consumer, Kafka } from 'kafkajs';
import {
  GASTROFLOW_DOMAIN_EVENTS_TOPIC,
  KAFKA
} from './kafka.constants';
import { InboxEventsRepository } from '../inbox/repositories/inbox-events.repository';

import type { Firestore } from 'firebase-admin/firestore';

import { FIRESTORE } from '../firestore/firestore.constants';
import type { DomainEventEnvelope } from '../events/domain-event-envelope';
import { StockConsumedHandler } from 'src/modules/dashboard/handlers/stock-consumed.handler';
import { StockConsumedEventPayload } from 'src/modules/stock-consumptions/events/stock-consumed.event';
import { DashboardGateway } from '../websockets/dashboard.gateway';

@Injectable()
export class KafkaConsumerService
  implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(KafkaConsumerService.name);
  private readonly consumer: Consumer;

  constructor(
    @Inject(KAFKA)
    kafka: Kafka,
    @Inject(FIRESTORE)
    private readonly firestore: Firestore,
    private readonly inboxEventsRepository: InboxEventsRepository,
    private readonly stockConsumedHandler: StockConsumedHandler,
    private readonly dashboardGateway: DashboardGateway
  ) {
    this.consumer = kafka.consumer({
      groupId: 'gastroflow-domain-events-consumer'
    });
  }

  async onModuleInit(): Promise<void> {
    await this.consumer.connect();

    await this.consumer.subscribe({
      topic: GASTROFLOW_DOMAIN_EVENTS_TOPIC,
      fromBeginning: false
    });

    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const value = message.value?.toString();

        if (!value) {
          return;
        }

        const event: DomainEventEnvelope = JSON.parse(value) as DomainEventEnvelope;

        const processed = await this.firestore.runTransaction(async (transaction) => {
          const alreadyProcessed = await this.inboxEventsRepository.existsInTransaction(transaction, event.eventId);

          if (alreadyProcessed) {
            this.logger.log(
              `Skipping already processed event ${event.eventId}`
            );

            return false;
          }

          if (event.eventType === this.stockConsumedHandler.eventType) {
            const stockConsumedEvent =
              event as DomainEventEnvelope<StockConsumedEventPayload>;

            await this.stockConsumedHandler.handle(
              transaction,
              stockConsumedEvent
            );
          }

          this.inboxEventsRepository.createInboxEventInTransaction(
            transaction,
            {
              id: event.eventId,
              eventId: event.eventId,
              eventType: event.eventType,
              restaurantId: event.restaurantId,
              processedAt: new Date().toISOString()
            }
          );
          return true;
        });

        if(!processed){
          return;
        }

        this.dashboardGateway.emitDashboardUpdated(event.restaurantId);

        this.logger.log(
          JSON.stringify({
            topic,
            partition,
            offset: message.offset,
            eventId: event.eventId,
            eventType: event.eventType
          })
        );
      }

    });

    this.logger.log('Kafka consumer connected and subscribed.');
  }

  async onApplicationShutdown(): Promise<void> {
    await this.consumer.disconnect();

    this.logger.log('Kafka consumer disconnected.');
  }
}