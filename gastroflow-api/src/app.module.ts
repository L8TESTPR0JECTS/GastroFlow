import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RecipesModule } from './modules/recipes/recipes.module';
import { FirestoreModule } from './common/firestore/firestore.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { SimulationsModule } from './modules/simulations/simulations.module';
import { IngredientsModule } from './modules/ingredients/ingredients.module';
import { RestaurantsModule } from './modules/restaurants/restaurants.module';
import { WasteEventsModule } from './modules/waste-events/waste-events.module';
import { RecommendationsModule } from './modules/recommendations/recommendations.module';
import { InventoryBatchesModule } from './modules/inventory-batches/inventory-batches.module';
import { StockConsumptionsModule } from './modules/stock-consumptions/stock-consumptions.module';
import { EventProcessingModule } from './event-processing/event-processing.module';
import { RedisModule } from './common/redis/redis.module';
import { RabbitMqModule } from './common/rabbitmq/rabbitmq.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    FirestoreModule,
    RestaurantsModule,
    IngredientsModule,
    InventoryBatchesModule,
    RecipesModule,
    StockConsumptionsModule,
    WasteEventsModule,
    RecommendationsModule,
    DashboardModule,
    SimulationsModule,
    EventProcessingModule,
    RabbitMqModule
  ],
})
export class AppModule {}
