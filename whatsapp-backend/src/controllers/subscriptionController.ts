import { Response, NextFunction } from "express";
import { TenantRequest } from "../middleware/tenancy";
import * as subscriptionService from "../services/subscriptionService";
import { changePlanSchema } from "../validators/subscription";
import { PLAN_CONFIG } from "../models/Subscription";

export async function getCurrentPlan(req: TenantRequest, res: Response, next: NextFunction) {
  try {
    const subscription = await subscriptionService.getCurrentSubscription(req.tenantId!);
    res.json(subscription);
  } catch (error) {
    next(error);
  }
}

export async function getPlans(_req: TenantRequest, res: Response) {
  res.json({
    plans: Object.entries(PLAN_CONFIG).map(([key, config]) => ({
      name: key,
      ...config,
    })),
  });
}

export async function changePlan(req: TenantRequest, res: Response, next: NextFunction) {
  try {
    const data = changePlanSchema.parse(req.body);
    const result = await subscriptionService.changePlan(req.tenantId!, data.plan);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function confirmPayment(req: TenantRequest, res: Response, next: NextFunction) {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
    const result = await subscriptionService.confirmPayment(req.tenantId!, {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
}
