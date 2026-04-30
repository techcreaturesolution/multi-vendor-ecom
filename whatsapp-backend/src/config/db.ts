import mongoose from "mongoose";
import { env } from "./env";
import { logger } from "./logger";

export async function connectDB(): Promise<void> {
  try {
    await mongoose.connect(env.mongodbUri);
    logger.info("MongoDB connected successfully");
  } catch (error) {
    logger.error("MongoDB connection error:", error);
    process.exit(1);
  }
}
