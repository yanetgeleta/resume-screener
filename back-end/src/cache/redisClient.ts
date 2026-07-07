import { Redis } from "ioredis";

function createRedisClient(): Redis {
  const redis = new Redis({
    host: process.env.REDIS_HOST ?? "localhost",
    port: 6379,
  });
  return redis;
}

const client = createRedisClient();
export { client as redis };
