import {
  Inject,
  Injectable,
  Logger,
  OnApplicationShutdown,
  OnModuleInit
} from '@nestjs/common';
import type { RedisClientType } from 'redis';

import { REDIS_CLIENT } from './redis.constants';

@Injectable()
export class RedisLifecycleService
  implements OnModuleInit, OnApplicationShutdown
{
  private readonly logger = new Logger(RedisLifecycleService.name);

  constructor(
    @Inject(REDIS_CLIENT)
    private readonly redisClient: RedisClientType
  ) {}

  async onModuleInit(): Promise<void> {
    this.logger.log('Connecting Redis client...');

    await this.redisClient.connect();

    this.logger.log('Redis client connected.');
  }

  async onApplicationShutdown(): Promise<void> {
    if (!this.redisClient.isOpen) {
      return;
    }

    this.logger.log('Disconnecting Redis client...');

    await this.redisClient.quit();

    this.logger.log('Redis client disconnected.');
  }
}