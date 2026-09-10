import { Module } from "@nestjs/common";
import { OutboxEventsRepository } from "./repositories/outbox-events.repository";
import { FirestoreOutboxEventsRepository } from "./repositories/firestore-outbox-events.repository";
import { FirestoreModule } from "../firestore/firestore.module";
import { OutboxProcessorService } from "./outbox-processor.service";
import { OutboxController } from "./outbox.controller";
import { EventsModule } from "../events/events.module";

@Module({
  imports:[FirestoreModule, EventsModule],
  controllers: [OutboxController],
  providers: [
    {
      provide: OutboxEventsRepository,
      useClass: FirestoreOutboxEventsRepository
    },
    OutboxProcessorService
  ],
  exports: [OutboxEventsRepository, OutboxProcessorService]
})
export class OutboxModule {}