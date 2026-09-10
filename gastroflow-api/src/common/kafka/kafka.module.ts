import { Module } from '@nestjs/common';
import { Kafka } from 'kafkajs';
import { getKafkaConfig } from './kafka.config';
import { KAFKA, KAFKA_PRODUCER } from './kafka.constants';
import { KafkaLifecycleService } from './kafka-lifecycle.service';
import { KafkaConsumerService } from './kafka-consumer.service';
import { InboxModule } from '../inbox/inbox.module';
import { FirestoreModule } from '../firestore/firestore.module';

@Module({
  imports: [FirestoreModule, InboxModule],
  providers: [
    {
      provide: KAFKA,
      useFactory: () => {
        const config = getKafkaConfig();

        return new Kafka({
          clientId: config.clientId,
          brokers: config.brokers
        });
      }
    },
    {
      provide: KAFKA_PRODUCER,
      inject: [KAFKA],
      useFactory: (kafka: Kafka) => {
        return kafka.producer();
      }
    },
    KafkaLifecycleService
  ],
  exports: [
    KAFKA,
    KAFKA_PRODUCER
  ]
})
export class KafkaModule {}