import { Response, NextFunction } from "express";
import { TenantRequest } from "../middleware/tenancy";
import * as campaignService from "../services/campaignService";
import { createCampaignSchema } from "../validators/campaign";

export async function createCampaign(req: TenantRequest, res: Response, next: NextFunction) {
  try {
    const data = createCampaignSchema.parse(req.body);
    const campaign = await campaignService.createCampaign(req.tenantId!, data);
    res.status(201).json(campaign);
  } catch (error) {
    next(error);
  }
}

export async function startCampaign(req: TenantRequest, res: Response, next: NextFunction) {
  try {
    const campaign = await campaignService.startCampaign(req.tenantId!, req.params.id);
    res.json(campaign);
  } catch (error) {
    next(error);
  }
}

export async function pauseCampaign(req: TenantRequest, res: Response, next: NextFunction) {
  try {
    const campaign = await campaignService.pauseCampaign(req.tenantId!, req.params.id);
    res.json(campaign);
  } catch (error) {
    next(error);
  }
}

export async function cancelCampaign(req: TenantRequest, res: Response, next: NextFunction) {
  try {
    const campaign = await campaignService.cancelCampaign(req.tenantId!, req.params.id);
    res.json(campaign);
  } catch (error) {
    next(error);
  }
}

export async function getCampaigns(req: TenantRequest, res: Response, next: NextFunction) {
  try {
    const result = await campaignService.getCampaigns(req.tenantId!, {
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      status: req.query.status as string,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getCampaignById(req: TenantRequest, res: Response, next: NextFunction) {
  try {
    const result = await campaignService.getCampaignById(req.tenantId!, req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
}
