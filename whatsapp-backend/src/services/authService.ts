import jwt, { SignOptions } from "jsonwebtoken";
import { env } from "../config/env";
import { User, IUser } from "../models/User";
import { Tenant } from "../models/Tenant";
import { Subscription, PLAN_CONFIG } from "../models/Subscription";
import { AppError } from "../middleware/errorHandler";

function generateToken(userId: string): string {
  return jwt.sign({ userId }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  } as SignOptions);
}

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function register(data: {
  email: string;
  password: string;
  name: string;
  businessName: string;
}) {
  const existingUser = await User.findOne({ email: data.email });
  if (existingUser) {
    throw new AppError("Email already registered", 409);
  }

  const user = new User({
    email: data.email,
    password: data.password,
    name: data.name,
    role: "tenant_admin",
  });

  const otp = generateOTP();
  user.otp = otp;
  user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

  const slug = slugify(data.businessName) + "-" + Date.now().toString(36);
  const tenant = new Tenant({
    name: data.businessName,
    slug,
    createdBy: user._id,
    plan: "free",
    messageQuota: PLAN_CONFIG.free.messageQuota,
  });

  user.tenantId = tenant._id as typeof user.tenantId;
  await tenant.save();
  await user.save();

  const subscription = new Subscription({
    tenantId: tenant._id,
    plan: "free",
    messageQuota: PLAN_CONFIG.free.messageQuota,
    priceMonthly: PLAN_CONFIG.free.priceMonthly,
  });
  await subscription.save();

  const token = generateToken((user._id as unknown as string).toString());

  return { user: sanitizeUser(user), tenant, token, otp };
}

export async function login(email: string, password: string) {
  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new AppError("Invalid email or password", 401);
  }

  const token = generateToken((user._id as unknown as string).toString());
  const tenant = user.tenantId ? await Tenant.findById(user.tenantId) : null;

  return { user: sanitizeUser(user), tenant, token };
}

export async function verifyOtp(email: string, otp: string) {
  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (!user.otp || !user.otpExpiresAt) {
    throw new AppError("No OTP requested", 400);
  }

  if (new Date() > user.otpExpiresAt) {
    throw new AppError("OTP expired", 400);
  }

  if (user.otp !== otp) {
    throw new AppError("Invalid OTP", 400);
  }

  user.isVerified = true;
  user.otp = null;
  user.otpExpiresAt = null;
  await user.save();

  return { message: "Email verified successfully" };
}

export async function getMe(userId: string) {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  const tenant = user.tenantId ? await Tenant.findById(user.tenantId) : null;
  return { user: sanitizeUser(user), tenant };
}

export async function addAgent(tenantId: string, data: { email: string; password: string; name: string }) {
  const existingUser = await User.findOne({ email: data.email });
  if (existingUser) {
    throw new AppError("Email already registered", 409);
  }

  const agent = new User({
    email: data.email,
    password: data.password,
    name: data.name,
    role: "agent",
    tenantId,
    isVerified: true,
  });

  await agent.save();
  return { user: sanitizeUser(agent) };
}

function sanitizeUser(user: IUser) {
  return {
    _id: user._id,
    email: user.email,
    name: user.name,
    role: user.role,
    tenantId: user.tenantId,
    isVerified: user.isVerified,
    createdAt: user.createdAt,
  };
}
