import { Test } from '@nestjs/testing';
import type { ConsumeMessage } from 'amqplib';

import {
  RABBITMQ_CHANNEL,
  REPLENISHMENT_REPORT_QUEUE
} from '../../../common/rabbitmq/rabbitmq.constants';

jest.mock('./inventory-replenishment.service', () => ({
  InventoryReplenishmentService:
    class InventoryReplenishmentService {}
}));

import { InventoryReplenishmentService } from './inventory-replenishment.service';
import { ReplenishmentReportWorker } from './replenishment-report.worker';

describe('ReplenishmentReportWorker', () => {
  let worker: ReplenishmentReportWorker;

  let consumeHandler:
    | ((message: ConsumeMessage | null) => Promise<void> | void)
    | undefined;

  const channel = {
    prefetch: jest.fn(),
    consume: jest.fn(
      async (
        _queue: string,
        handler: (
          message: ConsumeMessage | null
        ) => Promise<void> | void
      ) => {
        consumeHandler = handler;

        return {
          consumerTag: 'test-consumer'
        };
      }
    ),
    ack: jest.fn(),
    nack: jest.fn()
  };

  const inventoryReplenishmentService = {
    getReplenishmentSuggestions: jest.fn()
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    consumeHandler = undefined;

    const module = await Test.createTestingModule({
      providers: [
        ReplenishmentReportWorker,
        {
          provide: RABBITMQ_CHANNEL,
          useValue: channel
        },
        {
          provide: InventoryReplenishmentService,
          useValue: inventoryReplenishmentService
        }
      ]
    }).compile();

    worker = module.get(ReplenishmentReportWorker);

    await worker.onModuleInit();
  });

  describe('onModuleInit', () => {
    it('subscribes to the replenishment report queue', () => {
      expect(channel.prefetch).toHaveBeenCalledWith(1);

      expect(channel.consume).toHaveBeenCalledWith(
        REPLENISHMENT_REPORT_QUEUE,
        expect.any(Function),
        {
          noAck: false
        }
      );
    });
  });

  describe('message processing', () => {
    it('ACKs the message after successfully generating suggestions', async () => {
      inventoryReplenishmentService
        .getReplenishmentSuggestions
        .mockResolvedValue([
          {
            ingredientId: 'ingredient_steak',
            ingredientName: 'Steak',
            availableQuantity: 1500,
            targetStockQuantity: 10000,
            suggestedOrderQuantity: 8500
          }
        ]);

      const message = {
        content: Buffer.from(
          JSON.stringify({
            restaurantId: 'rest_demo_001',
            requestedAt: '2026-08-31T18:00:00.000Z'
          })
        ) } as ConsumeMessage;

      await consumeHandler!(message);

      expect(
        inventoryReplenishmentService
          .getReplenishmentSuggestions
      ).toHaveBeenCalledWith(
        'rest_demo_001'
      );

      expect(channel.ack).toHaveBeenCalledWith(message);

      expect(channel.nack).not.toHaveBeenCalled();
    });

    it('NACKs without requeue when processing fails', async () => {
      inventoryReplenishmentService
        .getReplenishmentSuggestions
        .mockRejectedValue(
          new Error('Report generation failed')
        );

      const message = {
        content: Buffer.from(
          JSON.stringify({
            restaurantId: 'rest_demo_001',
            requestedAt: '2026-08-31T18:00:00.000Z'
          })
        )
      } as ConsumeMessage;

      await consumeHandler!(message);

      expect(channel.ack).not.toHaveBeenCalled();

      expect(channel.nack).toHaveBeenCalledWith(
        message,
        false,
        false
      );
    });
  });
});