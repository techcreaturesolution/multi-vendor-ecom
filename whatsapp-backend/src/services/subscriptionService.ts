import Razorpay from "razorpay";
import { env } from "../config/env";
import { Subscription, PLAN_CONFIG } from "../models/Subscription";
import { Tenant } from "../models/Tenant";
import { AppError } from "../middleware/errorHandler";
import { logger } from "../config/logger";

type PlanType = keyof typeof PLAN_CONFIG;

let razorpay: Razorpay | null = null;
function getRazorpay(): Razorpay {
  if (!razorpay) {
    razorpay = new Razorpay({
      key_id: env.razorpayKeyId,
      key_secret: env.razorpayKeySecret,
    });
  }
  return razorpay;
}

export async function getCurrentSubscription(tenantId: string) {
  const subscription = await Subscription.findOne({ tenantId });
  if (!subscription) throw new AppError("Subscription not found", 404);
  return subscription;
}

export async function changePlan(tenantId: string, newPlan: PlanType) {
  const subscription = await Subscription.findOne({ tenantId });
  if (!subscription) throw new AppError("Subscription not found", 404);

  const planConfig = PLAN_CONFIG[newPlan];

  if (newPlan !== "free" && env.razorpayKeyId) {
    try {
      const rz = getRazorpay();
      const order = await rz.orders.create({
        amount: planConfig.priceMonthly * 100,
        currency: "INR",
        receipt: `sub_${tenantId}_${Date.now()}`,
        notes: { tenantId, plan: newPlan },
      });

      return {
        requiresPayment: true,
        orderId: order.id,
        amount: planConfig.priceMonthly,
        currency: "INR",
        plan: newPlan,
      };
    } catch (error) {
      logger.error("Razorpay order error:", error);
      throw new AppError("Payment initialization failed", 500);
    }
  }

  subscription.plan = newPlan;
  subscription.messageQuota = planConfig.messageQuota;
  subscription.priceMonthly = planConfig.priceMonthly;
  subscription.currentPeriodStart = new Date();
  subscription.currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await subscription.save();

  await Tenant.findByIdAndUpdate(tenantId, {
    plan: newPlan,
    messageQuota: planConfig.messageQuota,
  });

  return { requiresPayment: false, subscription };
}

export async function confirmPayment(tenantId: string, data: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  plan: PlanType;
}) {
  const crypto = await import("crypto");
  const generatedSignature = crypto
    .createHmac("sha256", env.razorpayKeySecret)
    .update(`${data.razorpayOrderId}|${data.razorpayPaymentId}`)
    .digest("hex");

  if (generatedSignature !== data.razorpaySignature) {
    throw new AppError("Invalid payment signature", 400);
  }

  const planConfig = PLAN_CONFIG[data.plan];
  const subscription = await Subscription.findOneAndUpdate(
    { tenantId },
    {
      plan: data.plan,
      status: "active",
      messageQuota: planConfig.messageQuota,
      priceMonthly: planConfig.priceMonthly,
      razorpaySubscriptionId: data.razorpayPaymentId,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    { new: true }
  );

  await Tenant.findByIdAndUpdate(tenantId, {
    plan: data.plan,
    messageQuota: planConfig.messageQuota,
  });

  return subscription;
}

export async function getPaymentHistory(tenantId: string) {
  const subscription = await Subscription.findOne({ tenantId });
  return subscription;
}
