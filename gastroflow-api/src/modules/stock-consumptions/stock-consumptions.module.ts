import { Module } from '@nestjs/common';
import { FirestoreModule } from '../../common/firestore/firestore.module';
import { IngredientsModule } from '../ingredients/ingredients.module';
import { InventoryBatchesModule } from '../inventory-batches/inventory-batches.module';
import { RecipesModule } from '../recipes/recipes.module';
import { RestaurantsModule } from '../restaurants/restaurants.module';
import {
  DOMAIN_EVENTS_PUBLISHER,
} from './../../common/events/domain-events-publisher';
import { LocalDomainEventsPublisher } from './../../common/events/local-domain-events.publisher';
import { StockMovementsRepository } from './repositories/stock-movements.repository';
import { StockConsumptionsController } from './stock-consumptions.controller';
import { StockConsumptionsService } from './stock-consumptions.service';
import { OutboxModule } from 'src/common/outbox/outbox.module';
import { EventsModule } from 'src/common/events/events.module';
import { RedisModule } from 'src/common/redis/redis.module';
import { WebsocketsModule } from 'src/common/websockets/websockets.module';

@Module({
  imports: [
    FirestoreModule,
    RestaurantsModule,
    IngredientsModule,
    InventoryBatchesModule,
    RecipesModule,
    OutboxModule,
    EventsModule,
    RedisModule,
    WebsocketsModule
  ],
  controllers: [StockConsumptionsController],
  providers: [
    StockConsumptionsService,
    StockMovementsRepository
  ],
  exports: [StockConsumptionsService, StockMovementsRepository],
})
export class StockConsumptionsModule {}
