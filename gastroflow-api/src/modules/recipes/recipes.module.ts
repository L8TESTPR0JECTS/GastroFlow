import { Module } from '@nestjs/common';
import { FirestoreModule } from '../../common/firestore/firestore.module';
import { IngredientsModule } from '../ingredients/ingredients.module';
import { RestaurantsModule } from '../restaurants/restaurants.module';
import { RecipesController } from './recipes.controller';
import { RecipesService } from './recipes.service';
import { RecipesRepository } from './repositories/recipes.repository';

@Module({
  imports: [FirestoreModule, RestaurantsModule, IngredientsModule],
  controllers: [RecipesController],
  providers: [RecipesService, RecipesRepository],
  exports: [RecipesService],
})
export class RecipesModule {}