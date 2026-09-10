import { Test } from '@nestjs/testing';
import type { Channel } from 'amqplib';

import {
  GASTROFLOW_TASKS_EXCHANGE,
  RABBITMQ_CHANNEL,
  REPLENISHMENT_REPORT_ROUTING_KEY
} from './rabbitmq.constants';

import { ReplenishmentReportPublisher } from './replenishment-report.publisher';

describe('ReplenishmentReportPublisher', () => {
  let publisher: ReplenishmentReportPublisher;

  const channel = {
    publish: jest.fn(),
    waitForConfirms: jest.fn().mockResolvedValue(undefined)
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ReplenishmentReportPublisher,
        {
          provide: RABBITMQ_CHANNEL,
          useValue: channel
        }
      ]
    }).compile();

    publisher = module.get(ReplenishmentReportPublisher);

    jest.clearAllMocks();
  });

  describe('publish', () => {
    it('publishes a persistent replenishment job to RabbitMQ', async () => {
      const job = {
        restaurantId: 'rest_demo_001',
        requestedAt: '2026-08-31T18:00:00.000Z'
      };

      await publisher.publish(job);

      expect(channel.publish).toHaveBeenCalledWith(
        GASTROFLOW_TASKS_EXCHANGE,
        REPLENISHMENT_REPORT_ROUTING_KEY,
        Buffer.from(JSON.stringify(job)),
        {
          persistent: true,
          contentType: 'application/json'
        }
      );

      expect(channel.waitForConfirms).toHaveBeenCalledTimes(1);
    });
  });
});