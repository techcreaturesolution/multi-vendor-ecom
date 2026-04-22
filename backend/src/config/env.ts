import dotenv from "dotenv";
dotenv.config();

export const env = {
  port: parseInt(process.env.PORT || "5000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  mongoUri: process.env.MONGO_URI || "mongodb://localhost:27017/multi_vendor_ecom",

  jwt: {
    secret: process.env.JWT_SECRET || "dev-secret",
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    refreshSecret: process.env.JWT_REFRESH_SECRET || "dev-refresh-secret",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d",
  },

  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || "",
    keySecret: process.env.RAZORPAY_KEY_SECRET || "",
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || "",
  },

  shipway: {
    username: process.env.SHIPWAY_USERNAME || "",
    apiKey: process.env.SHIPWAY_API_KEY || "",
    baseUrl: process.env.SHIPWAY_BASE_URL || "https://shipway.in/api",
  },

  upload: {
    dir: process.env.UPLOAD_DIR || "uploads",
    maxFileSizeMb: parseInt(process.env.MAX_FILE_SIZE_MB || "10", 10),
  },

  admin: {
    email: process.env.ADMIN_EMAIL || "admin@example.com",
    password: process.env.ADMIN_PASSWORD || "Admin@123",
  },
};
