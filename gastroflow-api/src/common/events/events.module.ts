import { Module } from '@nestjs/common';
import { DOMAIN_EVENTS_PUBLISHER } from './domain-events-publisher';
// import { LocalDomainEventsPublisher } from './local-domain-events.publisher'; //not active as Kafka took over
import { KafkaDomainEventsPublisher } from './kafka-domain-events.publisher';
import { KafkaModule } from '../kafka/kafka.module';

@Module({
  imports:[KafkaModule],
  providers: [
    {
      provide: DOMAIN_EVENTS_PUBLISHER,
      useClass: KafkaDomainEventsPublisher
    }
  ],
  exports: [DOMAIN_EVENTS_PUBLISHER]
})
export class EventsModule {}