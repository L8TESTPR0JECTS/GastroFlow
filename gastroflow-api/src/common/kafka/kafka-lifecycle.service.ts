import {
  Inject,
  Injectable,
  Logger,
  OnApplicationShutdown,
  OnModuleInit
} from '@nestjs/common';
import type { Producer } from 'kafkajs';
import { KAFKA_PRODUCER } from './kafka.constants';

@Injectable()
export class KafkaLifecycleService
  implements OnModuleInit, OnApplicationShutdown
{
  private readonly logger = new Logger(KafkaLifecycleService.name);

  constructor(
    @Inject(KAFKA_PRODUCER)
    private readonly producer: Producer
  ) {}

  async onModuleInit(): Promise<void> {
    this.logger.log('Connecting Kafka producer...');

    await this.producer.connect();

    this.logger.log('Kafka producer connected.');
  }

  async onApplicationShutdown(): Promise<void> {
    this.logger.log('Disconnecting Kafka producer...');

    await this.producer.disconnect();

    this.logger.log('Kafka producer disconnected.');
  }
}