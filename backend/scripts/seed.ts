import { connectDB } from "../src/config/db";
import { env } from "../src/config/env";
import { logger } from "../src/config/logger";
import { User } from "../src/models/User";
import { Category } from "../src/models/Category";
import mongoose from "mongoose";

async function run() {
  await connectDB();

  let admin = await User.findOne({ email: env.admin.email });
  if (!admin) {
    admin = await User.create({
      name: "Master Admin",
      email: env.admin.email,
      phone: "0000000000",
      password: env.admin.password,
      role: "master_admin",
      isEmailVerified: true,
    });
    logger.info(`Created master admin: ${admin.email}`);
  } else {
    logger.info(`Master admin already exists: ${admin.email}`);
  }

  const seeds = [
    { name: "Electronics", slug: "electronics", sortOrder: 1 },
    { name: "Fashion", slug: "fashion", sortOrder: 2 },
    { name: "Home & Kitchen", slug: "home-kitchen", sortOrder: 3 },
    { name: "Books", slug: "books", sortOrder: 4 },
    { name: "Beauty", slug: "beauty", sortOrder: 5 },
  ];
  for (const c of seeds) {
    const exists = await Category.findOne({ slug: c.slug });
    if (!exists) {
      await Category.create(c);
      logger.info(`Created category: ${c.name}`);
    }
  }

  await mongoose.disconnect();
  logger.info("Seed complete");
}

run().catch((err) => {
  logger.error(err);
  process.exit(1);
});
