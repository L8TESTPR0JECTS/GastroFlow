import { Module } from '@nestjs/common';
import { FirestoreModule } from '../../common/firestore/firestore.module';
import { IngredientsModule } from '../ingredients/ingredients.module';
import { RestaurantsModule } from '../restaurants/restaurants.module';
import { InventoryBatchesController } from './inventory-batches.controller';
import { InventoryBatchesService } from './inventory-batches.service';
import { InventoryBatchesRepository } from './repositories/inventory-batches.repository';
import { ReplenishmentPolicyService } from './services/replenishment-policy.service';
import { InventoryReplenishmentService } from './services/inventory-replenishment.service';
import { InventoryReplenishmentController } from './inventory-replenishment.controller';
import { ReplenishmentReportWorker } from './services/replenishment-report.worker';
import { RabbitMqModule } from 'src/common/rabbitmq/rabbitmq.module';

@Module({
  imports: [FirestoreModule, RestaurantsModule, IngredientsModule,RabbitMqModule],
  controllers: [InventoryBatchesController, InventoryReplenishmentController],
  providers: [
    InventoryBatchesService,
    InventoryBatchesRepository,
    ReplenishmentPolicyService,
    InventoryReplenishmentService,
    ReplenishmentReportWorker
  ],
  exports: [InventoryBatchesService, InventoryBatchesRepository, ReplenishmentPolicyService, InventoryReplenishmentService],
})
export class InventoryBatchesModule { }
