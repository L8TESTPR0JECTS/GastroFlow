import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CreateInventoryBatchDto } from './dto/create-inventory-batch.dto';
import { ListInventoryBatchesQueryDto } from './dto/list-inventory-batches-query.dto';
import { UpdateInventoryBatchDto } from './dto/update-inventory-batch.dto';
import { InventoryBatchesService } from './inventory-batches.service';
import type { InventoryBatch } from './models/inventory-batch.model';

@Controller('restaurants/:restaurantId/inventory-batches')
export class InventoryBatchesController {
  constructor(
    private readonly inventoryBatchesService: InventoryBatchesService,
  ) {}

  @Post()
  async createInventoryBatch(
    @Param('restaurantId') restaurantId: string,
    @Body() dto: CreateInventoryBatchDto,
  ): Promise<InventoryBatch> {
    return this.inventoryBatchesService.createInventoryBatch(
      restaurantId,
      dto,
    );
  }

  @Post('seed/demo')
  async seedDemoInventoryBatches(
    @Param('restaurantId') restaurantId: string,
  ): Promise<{
    restaurantId: string;
    inventoryBatchesCreated: number;
    inventoryBatches: InventoryBatch[];
  }> {
    return this.inventoryBatchesService.seedDemoInventoryBatches(
      restaurantId,
    );
  }

  @Get()
  async listInventoryBatches(
    @Param('restaurantId') restaurantId: string,
    @Query() query: ListInventoryBatchesQueryDto,
  ): Promise<InventoryBatch[]> {
    return this.inventoryBatchesService.listInventoryBatches(
      restaurantId,
      query,
    );
  }

  @Get(':batchId')
  async getInventoryBatchById(
    @Param('restaurantId') restaurantId: string,
    @Param('batchId') batchId: string,
  ): Promise<InventoryBatch> {
    return this.inventoryBatchesService.getInventoryBatchById(
      restaurantId,
      batchId,
    );
  }

  @Patch(':batchId')
  async updateInventoryBatch(
    @Param('restaurantId') restaurantId: string,
    @Param('batchId') batchId: string,
    @Body() dto: UpdateInventoryBatchDto,
  ): Promise<InventoryBatch> {
    return this.inventoryBatchesService.updateInventoryBatch(
      restaurantId,
      batchId,
      dto,
    );
  }

  @Delete(':batchId')
  async softDeleteInventoryBatch(
    @Param('restaurantId') restaurantId: string,
    @Param('batchId') batchId: string,
  ): Promise<InventoryBatch> {
    return this.inventoryBatchesService.softDeleteInventoryBatch(
      restaurantId,
      batchId,
    );
  }
}