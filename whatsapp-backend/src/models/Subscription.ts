import mongoose, { Schema, Document } from "mongoose";

export interface ISubscription extends Document {
  tenantId: mongoose.Types.ObjectId;
  plan: "free" | "starter" | "pro" | "enterprise";
  status: "active" | "past_due" | "cancelled" | "trialing";
  razorpaySubscriptionId: string;
  razorpayCustomerId: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  messageQuota: number;
  priceMonthly: number;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export const PLAN_CONFIG = {
  free: { messageQuota: 1000, priceMonthly: 0 },
  starter: { messageQuota: 10000, priceMonthly: 999 },
  pro: { messageQuota: 50000, priceMonthly: 2999 },
  enterprise: { messageQuota: 200000, priceMonthly: 9999 },
} as const;

const subscriptionSchema = new Schema<ISubscription>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, unique: true },
    plan: {
      type: String,
      enum: ["free", "starter", "pro", "enterprise"],
      default: "free",
    },
    status: {
      type: String,
      enum: ["active", "past_due", "cancelled", "trialing"],
      default: "active",
    },
    razorpaySubscriptionId: { type: String, default: "" },
    razorpayCustomerId: { type: String, default: "" },
    currentPeriodStart: { type: Date, default: Date.now },
    currentPeriodEnd: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    messageQuota: { type: Number, default: 1000 },
    priceMonthly: { type: Number, default: 0 },
    cancelledAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const Subscription = mongoose.model<ISubscription>("Subscription", subscriptionSchema);
