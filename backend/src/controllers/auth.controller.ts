import { Request, Response } from "express";
import { User } from "../models/User";
import { Vendor } from "../models/Vendor";
import { ApiError } from "../utils/apiError";
import { asyncHandler } from "../utils/asyncHandler";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../services/auth.service";

export const signupCustomer = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, phone, password } = req.body;
  const existing = await User.findOne({ email });
  if (existing) throw ApiError.conflict("Email already registered");

  const user = await User.create({ name, email, phone, password, role: "customer" });
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  user.refreshToken = refreshToken;
  await user.save();

  res.status(201).json({
    success: true,
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
    accessToken,
    refreshToken,
  });
});

export const signupVendor = asyncHandler(async (req: Request, res: Response) => {
  const {
    name,
    email,
    phone,
    password,
    businessName,
    businessType,
    address,
    bankDetails,
    gstNumber,
    panNumber,
  } = req.body;

  const existing = await User.findOne({ email });
  if (existing) throw ApiError.conflict("Email already registered");

  const user = await User.create({ name, email, phone, password, role: "vendor" });
  const vendor = await Vendor.create({
    userId: user._id,
    businessName,
    businessType,
    address,
    bankDetails,
    gstNumber,
    panNumber,
    status: "pending",
  });

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  user.refreshToken = refreshToken;
  await user.save();

  res.status(201).json({
    success: true,
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
    vendor: { id: vendor._id, status: vendor.status, businessName: vendor.businessName },
    accessToken,
    refreshToken,
    message: "Vendor registered. Pending admin approval.",
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select("+password");
  if (!user) throw ApiError.unauthorized("Invalid credentials");
  if (!user.isActive) throw ApiError.forbidden("Account is inactive");

  const ok = await user.comparePassword(password);
  if (!ok) throw ApiError.unauthorized("Invalid credentials");

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  user.refreshToken = refreshToken;
  await user.save();

  res.json({
    success: true,
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
    accessToken,
    refreshToken,
  });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw ApiError.unauthorized("Invalid refresh token");
  }
  const user = await User.findById(payload.sub).select("+refreshToken");
  if (!user || user.refreshToken !== refreshToken) {
    throw ApiError.unauthorized("Refresh token revoked");
  }
  const accessToken = signAccessToken(user);
  res.json({ success: true, accessToken });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  if (req.user) {
    await User.findByIdAndUpdate(req.user.sub, { $unset: { refreshToken: 1 } });
  }
  res.json({ success: true });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const user = await User.findById(req.user.sub);
  if (!user) throw ApiError.notFound("User not found");

  let vendor = null;
  if (user.role === "vendor") {
    vendor = await Vendor.findOne({ userId: user._id });
  }

  res.json({ success: true, user, vendor });
});
