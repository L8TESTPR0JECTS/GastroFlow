export interface RedisConfig {
  url: string;
}

export function getRedisConfig(): RedisConfig {
  return {
    url: process.env.REDIS_URL ?? 'redis://localhost:6379'
  };
}