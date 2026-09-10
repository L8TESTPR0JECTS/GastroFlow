import { Module } from '@nestjs/common';
import { FirestoreModule } from '../firestore/firestore.module';
import { FirestoreInboxEventsRepository } from './repositories/firestore-inbox-events.repository';
import { InboxEventsRepository } from './repositories/inbox-events.repository';

@Module({
  imports: [FirestoreModule],
  providers: [
    {
      provide: InboxEventsRepository,
      useClass: FirestoreInboxEventsRepository
    }
  ],
  exports: [InboxEventsRepository]
})
export class InboxModule {}