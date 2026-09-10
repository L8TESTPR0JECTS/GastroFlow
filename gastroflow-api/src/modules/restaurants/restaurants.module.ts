import { Module } from '@nestjs/common';
import { FirestoreModule } from '../../common/firestore/firestore.module';
import { RestaurantsRepository } from './repositories/restaurants.repository';
import { RestaurantsController } from './restaurants.controller';
import { RestaurantsService } from './restaurants.service';

@Module({
  imports: [FirestoreModule],
  controllers: [RestaurantsController],
  providers: [RestaurantsService, RestaurantsRepository],
  exports: [RestaurantsService],
})
export class RestaurantsModule {}