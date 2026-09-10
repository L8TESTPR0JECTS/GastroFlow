import { Module } from '@nestjs/common';

import { FirestoreModule } from '../common/firestore/firestore.module';
import { InboxModule } from '../common/inbox/inbox.module';
import { KafkaConsumerService } from '../common/kafka/kafka-consumer.service';
import { KafkaModule } from '../common/kafka/kafka.module';
import { DashboardModule } from '../modules/dashboard/dashboard.module';
import { WebsocketsModule } from 'src/common/websockets/websockets.module';

@Module({
  imports: [
    FirestoreModule,
    InboxModule,
    KafkaModule,
    DashboardModule,
    WebsocketsModule
  ],
  providers: [KafkaConsumerService]
})
export class EventProcessingModule {}