import { Inject, Injectable } from '@nestjs/common';
import type { Producer } from 'kafkajs';

import {
  GASTROFLOW_DOMAIN_EVENTS_TOPIC,
  KAFKA_PRODUCER
} from '../kafka/kafka.constants';

import type { DomainEventEnvelope } from './domain-event-envelope';
import type { DomainEventsPublisher } from './domain-events-publisher';

@Injectable()
export class KafkaDomainEventsPublisher
  implements DomainEventsPublisher
{
  constructor(
    @Inject(KAFKA_PRODUCER)
    private readonly producer: Producer
  ) {}

  async publish<TPayload extends object>(
    event: DomainEventEnvelope<TPayload>
  ): Promise<void> {
    await this.producer.send({
      topic: GASTROFLOW_DOMAIN_EVENTS_TOPIC,
      messages: [
        {
          key: event.restaurantId,
          value: JSON.stringify(event)
        }
      ]
    });
  }
}
