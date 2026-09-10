import { Inject, Injectable } from '@nestjs/common';
import type { RedisClientType } from 'redis';

import { REDIS_CLIENT } from './redis.constants';

@Injectable()
export class RedisCacheService {
  constructor(
    @Inject(REDIS_CLIENT)
    private readonly redisClient: RedisClientType
  ) {}

  async get<TValue>(key: string): Promise<TValue | null> {
    const value = await this.redisClient.get(key);

    if (value === null) {
      return null;
    }

    return JSON.parse(value) as TValue;
  }

  async set<TValue>(
    key: string,
    value: TValue,
    ttlSeconds: number
  ): Promise<void> {
    await this.redisClient.set(
      key,
      JSON.stringify(value),
      {
        EX: ttlSeconds
      }
    );
  }

  async delete(key: string): Promise<void> {
    await this.redisClient.del(key);
  }
}