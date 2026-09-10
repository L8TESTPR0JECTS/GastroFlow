import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { FIRESTORE } from './firestore.constants';

@Module({
  providers: [
    {
      provide: FIRESTORE,
      inject: [ConfigService],
      useFactory: (configService: ConfigService): Firestore => {
        const projectId =
          configService.get<string>('GCP_PROJECT_ID') ?? 'gastroflow-local';

        const emulatorHost = configService.get<string>('FIRESTORE_EMULATOR_HOST');

        if (emulatorHost) {
          process.env.FIRESTORE_EMULATOR_HOST = emulatorHost;
        }

        console.log('[Firestore] Project:', projectId);
        console.log(
          '[Firestore] Emulator:',
          process.env.FIRESTORE_EMULATOR_HOST ?? 'NOT CONFIGURED',
        );

        if (!getApps().length) {
          initializeApp({
            projectId,
          });
        }

        return getFirestore();
      },
    },
  ],
  exports: [FIRESTORE],
})
export class FirestoreModule {}