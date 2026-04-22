import mongoose, { Schema, Document, Types } from "mongoose";

export interface IPayment extends Document {
  orderId: Types.ObjectId;
  customerId: Types.ObjectId;
  gateway: "razorpay";
  gatewayOrderId: string;
  gatewayPaymentId?: string;
  gatewaySignature?: string;
  amount: number;
  currency: string;
  status: "created" | "authorized" | "captured" | "failed" | "refunded";
  method?: string;
  rawPayload?: Record<string, unknown>;
  capturedAt?: Date;
  refundedAt?: Date;
  refundAmount?: number;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    customerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    gateway: { type: String, enum: ["razorpay"], default: "razorpay" },
    gatewayOrderId: { type: String, required: true },
    gatewayPaymentId: { type: String },
    gatewaySignature: { type: String },
    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    status: {
      type: String,
      enum: ["created", "authorized", "captured", "failed", "refunded"],
      default: "created",
    },
    method: { type: String },
    rawPayload: { type: Schema.Types.Mixed },
    capturedAt: { type: Date },
    refundedAt: { type: Date },
    refundAmount: { type: Number },
  },
  { timestamps: true }
);

paymentSchema.index({ orderId: 1 });
paymentSchema.index({ gatewayOrderId: 1 });
paymentSchema.index({ gatewayPaymentId: 1 });

export const Payment = mongoose.model<IPayment>("Payment", paymentSchema);
