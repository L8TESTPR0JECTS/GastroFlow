import { Module } from '@nestjs/common';
import { FirestoreModule } from '../../common/firestore/firestore.module';
import { IngredientsModule } from '../ingredients/ingredients.module';
import { InventoryBatchesModule } from '../inventory-batches/inventory-batches.module';
import { RecipesModule } from '../recipes/recipes.module';
import { RecommendationsModule } from '../recommendations/recommendations.module';
import { RestaurantsModule } from '../restaurants/restaurants.module';
import { StockConsumptionsModule } from '../stock-consumptions/stock-consumptions.module';
import { WasteEventsModule } from '../waste-events/waste-events.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { StockConsumedHandler } from './handlers/stock-consumed.handler';
import { RedisModule } from 'src/common/redis/redis.module';

@Module({
  imports: [
    FirestoreModule,
    RestaurantsModule,
    IngredientsModule,
    InventoryBatchesModule,
    RecipesModule,
    StockConsumptionsModule,
    WasteEventsModule,
    RecommendationsModule,
    RedisModule
  ],
  controllers: [DashboardController],
  providers: [DashboardService, StockConsumedHandler],
  exports: [DashboardService, StockConsumedHandler]
})
export class DashboardModule {}
