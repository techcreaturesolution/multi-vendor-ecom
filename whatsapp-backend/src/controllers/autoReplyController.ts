import { Response, NextFunction } from "express";
import { TenantRequest } from "../middleware/tenancy";
import * as autoReplyService from "../services/autoReplyService";
import { createAutoReplySchema, updateAutoReplySchema } from "../validators/autoReply";

export async function createRule(req: TenantRequest, res: Response, next: NextFunction) {
  try {
    const data = createAutoReplySchema.parse(req.body);
    const rule = await autoReplyService.createRule(req.tenantId!, data);
    res.status(201).json(rule);
  } catch (error) {
    next(error);
  }
}

export async function getRules(req: TenantRequest, res: Response, next: NextFunction) {
  try {
    const rules = await autoReplyService.getRules(
      req.tenantId!,
      req.query.waAccountId as string
    );
    res.json({ rules });
  } catch (error) {
    next(error);
  }
}

export async function updateRule(req: TenantRequest, res: Response, next: NextFunction) {
  try {
    const data = updateAutoReplySchema.parse(req.body);
    const rule = await autoReplyService.updateRule(req.tenantId!, req.params.id, data);
    res.json(rule);
  } catch (error) {
    next(error);
  }
}

export async function deleteRule(req: TenantRequest, res: Response, next: NextFunction) {
  try {
    const result = await autoReplyService.deleteRule(req.tenantId!, req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
}
