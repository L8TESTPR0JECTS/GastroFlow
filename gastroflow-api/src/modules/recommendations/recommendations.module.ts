import { Module } from '@nestjs/common';
import { FirestoreModule } from '../../common/firestore/firestore.module';
import { InventoryBatchesModule } from '../inventory-batches/inventory-batches.module';
import { RecipesModule } from '../recipes/recipes.module';
import { RestaurantsModule } from '../restaurants/restaurants.module';
import { WasteEventsModule } from '../waste-events/waste-events.module';
import { RecommendationsController } from './recommendations.controller';
import { RecommendationsService } from './recommendations.service';
import { RecommendationsRepository } from './repositories/recommendations.repository';

const mainExportProviders:any[] = [RecommendationsService, RecommendationsRepository];

@Module({
  imports: [
    FirestoreModule,
    RestaurantsModule,
    InventoryBatchesModule,
    RecipesModule,
    WasteEventsModule,
  ],
  controllers: [RecommendationsController],
  providers: [...mainExportProviders],
  exports: [...mainExportProviders],
})
export class RecommendationsModule {}
