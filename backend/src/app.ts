import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { env } from "./config/env";
import { errorHandler, notFoundHandler } from "./middleware/error";

import authRoutes from "./routes/auth.routes";
import adminRoutes from "./routes/admin";
import vendorRoutes from "./routes/vendor";
import customerRoutes from "./routes/customer";
import webhookRoutes from "./routes/webhooks";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: true, credentials: true }));
  app.use(
    morgan(env.nodeEnv === "production" ? "combined" : "dev", {
      skip: (_req, res) => env.nodeEnv === "test" && res.statusCode < 400,
    })
  );

  // Capture raw body for webhook signature verification
  app.use(
    express.json({
      limit: "2mb",
      verify: (req, _res, buf) => {
        (req as unknown as { rawBody?: string }).rawBody = buf.toString("utf8");
      },
    })
  );
  app.use(express.urlencoded({ extended: true }));

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: env.nodeEnv === "production" ? 300 : 2000,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use("/api", limiter);

  app.get("/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", env: env.nodeEnv, time: new Date().toISOString() });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/vendor", vendorRoutes);
  app.use("/api/customer", customerRoutes);
  app.use("/api/webhooks", webhookRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
