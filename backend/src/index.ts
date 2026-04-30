import http from "http";
import app from "./app";
import { env } from "./config/env";
import { connectDB } from "./config/db";
import { initSocket } from "./utils/socket";
import { startCampaignWorker } from "./queues/campaignWorker";
import { logger } from "./config/logger";

async function main() {
  await connectDB();

  const server = http.createServer(app);
  initSocket(server);

  if (env.redisHost) {
    try {
      startCampaignWorker();
      logger.info("Campaign worker started");
    } catch (error) {
      logger.warn("Campaign worker failed to start (Redis may not be available):", error);
    }
  }

  server.listen(env.port, () => {
    logger.info(`Server running on port ${env.port} in ${env.nodeEnv} mode`);
  });
}

main().catch((error) => {
  logger.error("Failed to start server:", error);
  process.exit(1);
});
