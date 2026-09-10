import { Module } from '@nestjs/common';
import { DOMAIN_EVENTS_PUBLISHER } from '../../common/events/domain-events-publisher';
import { LocalDomainEventsPublisher } from '../../common/events/local-domain-events.publisher';
import { FirestoreModule } from '../../common/firestore/firestore.module';
import { InventoryBatchesModule } from '../inventory-batches/inventory-batches.module';
import { RestaurantsModule } from '../restaurants/restaurants.module';
import { WasteEventsRepository } from './repositories/waste-events.repository';
import { WasteEventsController } from './waste-events.controller';
import { WasteEventsService } from './waste-events.service';
import { EventsModule } from 'src/common/events/events.module';

@Module({
  imports: [
    FirestoreModule,
    RestaurantsModule,
    InventoryBatchesModule,
    EventsModule
  ],
  controllers: [WasteEventsController],
  providers: [
    WasteEventsService,
    WasteEventsRepository
  ],
  exports: [WasteEventsService, WasteEventsRepository],
})
export class WasteEventsModule {}