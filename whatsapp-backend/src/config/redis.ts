import IORedis from "ioredis";
import { env } from "./env";
import { logger } from "./logger";

export const redisConnection = new IORedis({
  host: env.redisHost,
  port: env.redisPort,
  maxRetriesPerRequest: null,
});

redisConnection.on("connect", () => logger.info("Redis connected"));
redisConnection.on("error", (err) => logger.error("Redis error:", err));
