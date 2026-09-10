import { Inject, Injectable } from '@nestjs/common';
import type { ConfirmChannel } from 'amqplib';

import {
  GASTROFLOW_TASKS_EXCHANGE,
  RABBITMQ_CHANNEL,
  REPLENISHMENT_REPORT_ROUTING_KEY
} from './rabbitmq.constants';

export interface ReplenishmentReportJob {
  restaurantId: string;
  requestedAt: string;
}

@Injectable()
export class ReplenishmentReportPublisher {
  constructor(
    @Inject(RABBITMQ_CHANNEL)
    private readonly channel: ConfirmChannel
  ) {}

  async publish(job: ReplenishmentReportJob): Promise<void> {
    this.channel.publish(
      GASTROFLOW_TASKS_EXCHANGE,
      REPLENISHMENT_REPORT_ROUTING_KEY,
      Buffer.from(JSON.stringify(job)),
      {
        persistent: true,
        contentType: 'application/json'
      }
    );
    await this.channel.waitForConfirms();
  }
}