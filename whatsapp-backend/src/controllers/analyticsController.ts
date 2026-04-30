import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth";
import { TenantRequest } from "../middleware/tenancy";
import * as analyticsService from "../services/analyticsService";

export async function getDashboard(req: TenantRequest, res: Response, next: NextFunction) {
  try {
    const result = await analyticsService.getTenantDashboard(req.tenantId!);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getCampaignReport(req: TenantRequest, res: Response, next: NextFunction) {
  try {
    const result = await analyticsService.getCampaignReport(req.tenantId!, req.params.id);
    if (!result) {
      res.status(404).json({ error: "Campaign not found" });
      return;
    }
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getMessageTrend(req: TenantRequest, res: Response, next: NextFunction) {
  try {
    const days = req.query.days ? parseInt(req.query.days as string) : 30;
    const result = await analyticsService.getMessageTrend(req.tenantId!, days);
    res.json({ trend: result });
  } catch (error) {
    next(error);
  }
}

export async function getSuperAdminDashboard(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await analyticsService.getSuperAdminDashboard();
    res.json(result);
  } catch (error) {
    next(error);
  }
}
