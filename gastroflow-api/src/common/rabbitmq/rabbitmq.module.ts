import { Global, Module } from '@nestjs/common';
import amqp, {
  ChannelModel,
  ConfirmChannel
} from 'amqplib';

import {
  RABBITMQ_CHANNEL,
  RABBITMQ_CONNECTION
} from './rabbitmq.constants';
import { RabbitMqLifecycleService } from './rabbitmq-lifecycle.service';
import { ReplenishmentReportPublisher } from './replenishment-report.publisher';

@Global()
@Module({
  providers: [
    {
      provide: RABBITMQ_CONNECTION,
      useFactory: async (): Promise<ChannelModel> => {
        const url =
          process.env.RABBITMQ_URL ??
          'amqp://guest:guest@localhost:5672';

        console.log('Connecting to RabbitMQ:', url);

        const connection = await amqp.connect(url);

        console.log('RabbitMQ connection created');

        return connection;
      }
    },
    {
      provide: RABBITMQ_CHANNEL,
      inject: [RABBITMQ_CONNECTION],
      useFactory: async (
        connection: ChannelModel
      ): Promise<ConfirmChannel> => {
        return connection.createConfirmChannel();
      }
    },
    RabbitMqLifecycleService,
    ReplenishmentReportPublisher
  ],
  exports: [
    RABBITMQ_CONNECTION,
    RABBITMQ_CHANNEL,
    ReplenishmentReportPublisher
  ]
})
export class RabbitMqModule { }