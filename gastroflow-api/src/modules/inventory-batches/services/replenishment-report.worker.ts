import {
    Inject,
    Injectable,
    Logger,
    OnModuleInit
} from '@nestjs/common';
import type {
    Channel,
    ConsumeMessage
} from 'amqplib';

import { RABBITMQ_CHANNEL, REPLENISHMENT_REPORT_QUEUE } from '../../../common/rabbitmq/rabbitmq.constants';
import type { ReplenishmentReportJob } from '../../../common/rabbitmq/replenishment-report.publisher';

import { InventoryReplenishmentService } from './inventory-replenishment.service';

@Injectable()
export class ReplenishmentReportWorker implements OnModuleInit {
    private readonly logger = new Logger(ReplenishmentReportWorker.name);

    constructor(
        @Inject(RABBITMQ_CHANNEL)
        private readonly channel: Channel,

        private readonly inventoryReplenishmentService:
            InventoryReplenishmentService
    ) { }

    async onModuleInit(): Promise<void> {
        await this.channel.prefetch(1);

        await this.channel.consume(
            REPLENISHMENT_REPORT_QUEUE,
            async (message: ConsumeMessage | null) => {
                if (!message) {
                    return;
                }

                try {
                    const job = JSON.parse(message.content.toString()) as ReplenishmentReportJob;
                    this.logger.log(`Received replenishment report job for ${job.restaurantId}`);
                    const suggestions = await this.inventoryReplenishmentService.getReplenishmentSuggestions(job.restaurantId);
                    this.logger.log(`Generated ${suggestions.length} replenishment suggestions`);

                    this.logger.log(
                        JSON.stringify({
                            restaurantId: job.restaurantId,
                            requestedAt: job.requestedAt,
                            suggestions
                        })
                    );

                    await new Promise(resolve => setTimeout(resolve, 3000));
                    
                    this.channel.ack(message);
                    this.logger.log(`ACKed replenishment report job for ${job.restaurantId}`);
                } catch (error) {
                    this.logger.error('Failed to generate replenishment report', error);
                    this.channel.nack(
                        message,
                        false,
                        false
                    );
                }
            },
            {
                noAck: false
            }
        );

        this.logger.log(
            'Replenishment report worker listening.'
        );
    }
}