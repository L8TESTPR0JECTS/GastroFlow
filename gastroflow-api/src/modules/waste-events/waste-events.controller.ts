import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { CreateWasteEventDto } from './dto/create-waste-event.dto';
import { ListWasteEventsQueryDto } from './dto/list-waste-events-query.dto';
import type { WasteEventResult } from './models/waste-event-result.model';
import type { WasteEvent } from './models/waste-event.model';
import { WasteEventsService } from './waste-events.service';

@Controller('restaurants/:restaurantId/waste-events')
export class WasteEventsController {
  constructor(
    private readonly wasteEventsService: WasteEventsService,
  ) {}

  @Post()
  async createWasteEvent(
    @Param('restaurantId') restaurantId: string,
    @Body() dto: CreateWasteEventDto,
  ): Promise<WasteEventResult> {
    return this.wasteEventsService.createWasteEvent(
      restaurantId,
      dto,
    );
  }

  @Get()
  async listWasteEvents(
    @Param('restaurantId') restaurantId: string,
    @Query() query: ListWasteEventsQueryDto,
  ): Promise<WasteEvent[]> {
    return this.wasteEventsService.listWasteEvents(
      restaurantId,
      query,
    );
  }

  @Get(':wasteEventId')
  async getWasteEventById(
    @Param('restaurantId') restaurantId: string,
    @Param('wasteEventId') wasteEventId: string,
  ): Promise<WasteEvent> {
    return this.wasteEventsService.getWasteEventById(
      restaurantId,
      wasteEventId,
    );
  }
}