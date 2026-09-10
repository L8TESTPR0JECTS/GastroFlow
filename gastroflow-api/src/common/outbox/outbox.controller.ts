import {
  Controller,
  Post,
  Query
} from '@nestjs/common';
import type { OutboxProcessingResult } from './models/outbox-processing-result.model';
import { OutboxProcessorService } from './outbox-processor.service';

@Controller('internal/outbox')
export class OutboxController {
  constructor(
    private readonly outboxProcessorService: OutboxProcessorService
  ) {}

  @Post('process')
  async processPendingEvents(
    @Query('limit') limit?: string
  ): Promise<OutboxProcessingResult> {
    return this.outboxProcessorService.processPendingEvents(
      limit ? Number(limit) : 25
    );
  }
}