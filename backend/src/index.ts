import { createApp } from "./app";
import { connectDB } from "./config/db";
import { env } from "./config/env";
import { logger } from "./config/logger";

async function main() {
  await connectDB();
  const app = createApp();
  app.listen(env.port, () => {
    logger.info(`Server listening on port ${env.port} (${env.nodeEnv})`);
  });
}

main().catch((err) => {
  logger.error("Startup failed", err);
  process.exit(1);
});
