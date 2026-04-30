import { Queue } from "bullmq";
import { redisConnection } from "../config/redis";

export const campaignQueue = new Queue("campaign-messages", {
  connection: redisConnection,
  defaultJobOptions: {
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
  },
});
