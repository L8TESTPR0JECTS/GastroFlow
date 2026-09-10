import { Module } from '@nestjs/common';
import { createClient } from 'redis';

import { getRedisConfig } from './redis.config';
import { REDIS_CLIENT } from './redis.constants';
import { RedisCacheService } from './redis-cache.service';
import { RedisLifecycleService } from './redis-lifecycle.service';

@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: () => {
        const config = getRedisConfig();

        return createClient({
          url: config.url
        });
      }
    },
    RedisLifecycleService,
    RedisCacheService
  ],
  exports: [
    REDIS_CLIENT,
    RedisCacheService
  ]
})
export class RedisModule {}