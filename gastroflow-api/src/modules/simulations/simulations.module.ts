import { Module } from '@nestjs/common';
import { InventoryBatchesModule } from '../inventory-batches/inventory-batches.module';
import { RecipesModule } from '../recipes/recipes.module';
import { RecommendationsModule } from '../recommendations/recommendations.module';
import { RestaurantsModule } from '../restaurants/restaurants.module';
import { StockConsumptionsModule } from '../stock-consumptions/stock-consumptions.module';
import { WasteEventsModule } from '../waste-events/waste-events.module';
import { SimulationPlanningService } from './simulation-planning.service';
import { SimulationsController } from './simulations.controller';
import { SimulationsService } from './simulations.service';

@Module({
  imports: [
    RestaurantsModule,
    RecipesModule,
    InventoryBatchesModule,
    StockConsumptionsModule,
    WasteEventsModule,
    RecommendationsModule
  ],
  controllers: [SimulationsController],
  providers: [SimulationPlanningService, SimulationsService],
  exports: [SimulationsService]
})
export class SimulationsModule {}