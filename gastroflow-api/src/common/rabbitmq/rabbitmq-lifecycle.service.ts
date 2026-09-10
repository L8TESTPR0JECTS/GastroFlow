import {
  Inject,
  Injectable,
  OnApplicationShutdown,
  OnModuleInit
} from '@nestjs/common';

import type {
  Channel,
  ChannelModel
} from 'amqplib';

import {
  GASTROFLOW_DEAD_LETTER_EXCHANGE,
  GASTROFLOW_TASKS_EXCHANGE,
  RABBITMQ_CHANNEL,
  RABBITMQ_CONNECTION,
  REPLENISHMENT_REPORT_DLQ,
  REPLENISHMENT_REPORT_FAILED_ROUTING_KEY,
  REPLENISHMENT_REPORT_QUEUE,
  REPLENISHMENT_REPORT_ROUTING_KEY
} from './rabbitmq.constants';

@Injectable()
export class RabbitMqLifecycleService
  implements OnModuleInit, OnApplicationShutdown {

  constructor(
    @Inject(RABBITMQ_CONNECTION)
    private readonly connection: ChannelModel,

    @Inject(RABBITMQ_CHANNEL)
    private readonly channel: Channel
  ) {}

  async onModuleInit(): Promise<void> {
    console.log('RabbitMQ lifecycle starting');

    await this.assertTopology();

    console.log('RabbitMQ connected');
  }

  async onApplicationShutdown(): Promise<void> {
    await this.channel.close();
    await this.connection.close();
  }

  private async assertTopology(): Promise<void> {
    await this.channel.assertExchange(
      GASTROFLOW_TASKS_EXCHANGE,
      'direct',
      { durable: true }
    );

    await this.channel.assertExchange(
      GASTROFLOW_DEAD_LETTER_EXCHANGE,
      'direct',
      { durable: true }
    );

    await this.channel.assertQueue(
      REPLENISHMENT_REPORT_QUEUE,
      { durable: true }
    );

    await this.channel.assertQueue(
      REPLENISHMENT_REPORT_DLQ,
      { durable: true }
    );

    await this.channel.bindQueue(
      REPLENISHMENT_REPORT_QUEUE,
      GASTROFLOW_TASKS_EXCHANGE,
      REPLENISHMENT_REPORT_ROUTING_KEY
    );

    await this.channel.bindQueue(
      REPLENISHMENT_REPORT_DLQ,
      GASTROFLOW_DEAD_LETTER_EXCHANGE,
      REPLENISHMENT_REPORT_FAILED_ROUTING_KEY
    );
  }
}