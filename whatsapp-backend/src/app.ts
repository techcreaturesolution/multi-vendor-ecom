import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { env } from "./config/env";
import { errorHandler } from "./middleware/errorHandler";

import authRoutes from "./routes/auth";
import whatsappAccountRoutes from "./routes/whatsappAccounts";
import contactRoutes from "./routes/contacts";
import campaignRoutes from "./routes/campaigns";
import chatRoutes from "./routes/chat";
import autoReplyRoutes from "./routes/autoReply";
import analyticsRoutes from "./routes/analytics";
import subscriptionRoutes from "./routes/subscription";
import webhookRoutes from "./routes/webhook";
import adminRoutes from "./routes/admin";

const app = express();

app.use(helmet());
app.use(cors({ origin: env.frontendUrl, credentials: true }));
app.use(morgan("dev"));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", apiLimiter);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/whatsapp-accounts", whatsappAccountRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/campaigns", campaignRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/auto-reply", autoReplyRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/subscription", subscriptionRoutes);
app.use("/api/webhook", webhookRoutes);
app.use("/api/admin", adminRoutes);

app.use(errorHandler);

export default app;
