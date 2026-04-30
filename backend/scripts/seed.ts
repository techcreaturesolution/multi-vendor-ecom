import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { User } from "../src/models/User";
import { env } from "../src/config/env";

async function seed() {
  await mongoose.connect(env.mongodbUri);
  console.log("Connected to MongoDB");

  const existingAdmin = await User.findOne({ role: "super_admin" });
  if (existingAdmin) {
    console.log("Super admin already exists:", existingAdmin.email);
  } else {
    const admin = new User({
      email: env.superAdminEmail,
      password: env.superAdminPassword,
      name: "Super Admin",
      role: "super_admin",
      isVerified: true,
    });
    await admin.save();
    console.log("Super admin created:", admin.email);
  }

  await mongoose.disconnect();
  console.log("Seed complete");
}

seed().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
