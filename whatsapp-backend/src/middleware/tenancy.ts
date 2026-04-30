import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth";
import { Tenant } from "../models/Tenant";

export interface TenantRequest extends AuthRequest {
  tenantId?: string;
}

export async function tenantGuard(req: TenantRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  if (req.user.role === "super_admin") {
    const tenantIdParam = req.headers["x-tenant-id"] as string;
    if (tenantIdParam) {
      req.tenantId = tenantIdParam;
    }
    return next();
  }

  if (!req.user.tenantId) {
    res.status(403).json({ error: "No tenant assigned to this user" });
    return;
  }

  const tenant = await Tenant.findById(req.user.tenantId);
  if (!tenant || tenant.status !== "active") {
    res.status(403).json({ error: "Tenant is not active" });
    return;
  }

  req.tenantId = req.user.tenantId.toString();
  next();
}
