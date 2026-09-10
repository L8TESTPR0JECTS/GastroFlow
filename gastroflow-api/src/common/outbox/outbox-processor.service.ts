import {
  Inject,
  Injectable,
  Logger
} from '@nestjs/common';
import {
  DOMAIN_EVENTS_PUBLISHER
} from '../events/domain-events-publisher';
import type { DomainEventsPublisher } from '../events/domain-events-publisher';
import { nowIso } from '../utils/date.util';
import type { OutboxProcessingResult } from './models/outbox-processing-result.model';
import { OutboxEventsRepository } from './repositories/outbox-events.repository';

@Injectable()
export class OutboxProcessorService {
  private readonly logger = new Logger(OutboxProcessorService.name);
  private readonly maxAttempts = 3;

  constructor(
    private readonly outboxEventsRepository: OutboxEventsRepository,
    @Inject(DOMAIN_EVENTS_PUBLISHER)
    private readonly domainEventsPublisher: DomainEventsPublisher
  ) {}

  async processPendingEvents(limit = 25): Promise<OutboxProcessingResult> {
    const outboxEvents =
      await this.outboxEventsRepository.findPendingOutboxEvents(limit);

    const result: OutboxProcessingResult = {
      found: outboxEvents.length,
      published: 0,
      failed: 0,
      pendingRetry: 0
    };

    for (const outboxEvent of outboxEvents) {
      const attempts = outboxEvent.attempts + 1;
      const attemptedAt = nowIso();

      try {
        await this.domainEventsPublisher.publish(outboxEvent.event);

        await this.outboxEventsRepository.markOutboxEventPublished(
          outboxEvent.id,
          attempts,
          attemptedAt
        );

        result.published += 1;
      } catch (error) {
        const lastError = this.getErrorMessage(error);
        const shouldRetry = attempts < this.maxAttempts;

        await this.outboxEventsRepository.markOutboxEventFailed(
          outboxEvent.id,
          attempts,
          attemptedAt,
          lastError,
          shouldRetry
        );

        if (shouldRetry) {
          result.pendingRetry += 1;
        } else {
          result.failed += 1;
        }

        this.logger.error(
          `Failed to publish outbox event ${outboxEvent.id}: ${lastError}`
        );
      }
    }

    return result;
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    return 'Unknown error.';
  }
}