import dotenv from "dotenv";
dotenv.config();

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "5000", 10),

  mongodbUri: process.env.MONGODB_URI || "mongodb://localhost:27017/whatsapp-saas",

  redisHost: process.env.REDIS_HOST || "localhost",
  redisPort: parseInt(process.env.REDIS_PORT || "6379", 10),

  jwtSecret: process.env.JWT_SECRET || "dev-jwt-secret",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",

  superAdminEmail: process.env.SUPER_ADMIN_EMAIL || "admin@whatsapp-saas.com",
  superAdminPassword: process.env.SUPER_ADMIN_PASSWORD || "admin123456",

  metaAppSecret: process.env.META_APP_SECRET || "",
  metaWebhookVerifyToken: process.env.META_WEBHOOK_VERIFY_TOKEN || "verify-token",

  razorpayKeyId: process.env.RAZORPAY_KEY_ID || "",
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || "",
  razorpayWebhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || "",

  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
};
