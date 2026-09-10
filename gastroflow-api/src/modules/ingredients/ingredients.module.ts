import { Module } from '@nestjs/common';
import { FirestoreModule } from '../../common/firestore/firestore.module';
import { RestaurantsModule } from '../restaurants/restaurants.module';
import { IngredientsController } from './ingredients.controller';
import { IngredientsService } from './ingredients.service';
import { IngredientsRepository } from './repositories/ingredients.repository';

@Module({
  imports: [FirestoreModule, RestaurantsModule],
  controllers: [IngredientsController],
  providers: [IngredientsService, IngredientsRepository],
  exports: [IngredientsService],
})
export class IngredientsModule {}