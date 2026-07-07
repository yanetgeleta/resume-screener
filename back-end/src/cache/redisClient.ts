import { Redis } from "ioredis";

function createRedisClient(): Redis {
  const redis = new Redis({
    host: process.env.REDIS_HOST ?? "localhost",
    port: 6379,
    lazyConnect: true,
    maxRetriesPerRequest: 1,
  });
  redis.on("error", (err) => {
    console.log("Redis error: ", err.message);
  });
  return redis;
}

const client = createRedisClient();
export { client as redis };
