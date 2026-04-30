import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth";
import { Tenant } from "../models/Tenant";
import { User } from "../models/User";
import { AppError } from "../middleware/errorHandler";

export async function listTenants(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const skip = (page - 1) * limit;

    const [tenants, total] = await Promise.all([
      Tenant.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      Tenant.countDocuments(),
    ]);

    res.json({ tenants, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
}

export async function getTenantById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) throw new AppError("Tenant not found", 404);

    const users = await User.find({ tenantId: tenant._id }).select("-password -otp -otpExpiresAt");
    res.json({ tenant, users });
  } catch (error) {
    next(error);
  }
}

export async function suspendTenant(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const tenant = await Tenant.findByIdAndUpdate(
      req.params.id,
      { status: "suspended" },
      { new: true }
    );
    if (!tenant) throw new AppError("Tenant not found", 404);
    res.json(tenant);
  } catch (error) {
    next(error);
  }
}

export async function activateTenant(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const tenant = await Tenant.findByIdAndUpdate(
      req.params.id,
      { status: "active" },
      { new: true }
    );
    if (!tenant) throw new AppError("Tenant not found", 404);
    res.json(tenant);
  } catch (error) {
    next(error);
  }
}

export async function deleteTenant(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const tenant = await Tenant.findByIdAndDelete(req.params.id);
    if (!tenant) throw new AppError("Tenant not found", 404);
    await User.deleteMany({ tenantId: tenant._id });
    res.json({ message: "Tenant and associated users deleted" });
  } catch (error) {
    next(error);
  }
}
