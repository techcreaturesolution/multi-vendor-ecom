import mongoose, { Schema, Document, Types } from "mongoose";

export interface IReturnRequest extends Document {
  orderId: Types.ObjectId;
  customerId: Types.ObjectId;
  vendorId: Types.ObjectId;
  items: {
    productId: Types.ObjectId;
    quantity: number;
    reason: string;
  }[];
  status: "requested" | "approved" | "rejected" | "picked_up" | "received" | "refunded";
  refundAmount?: number;
  vendorNote?: string;
  resolvedAt?: Date;
  gatewayRefundId?: string;
  refundStatus?: "pending" | "processing" | "processed" | "failed";
  refundError?: string;
  createdAt: Date;
  updatedAt: Date;
}

const returnRequestSchema = new Schema<IReturnRequest>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    customerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    vendorId: { type: Schema.Types.ObjectId, ref: "Vendor", required: true },
    items: [
      {
        productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
        quantity: { type: Number, required: true },
        reason: { type: String, required: true },
      },
    ],
    status: {
      type: String,
      enum: ["requested", "approved", "rejected", "picked_up", "received", "refunded"],
      default: "requested",
    },
    refundAmount: { type: Number },
    vendorNote: { type: String },
    resolvedAt: { type: Date },
    gatewayRefundId: { type: String },
    refundStatus: {
      type: String,
      enum: ["pending", "processing", "processed", "failed"],
    },
    refundError: { type: String },
  },
  { timestamps: true }
);

returnRequestSchema.index({ orderId: 1 });
returnRequestSchema.index({ customerId: 1 });
returnRequestSchema.index({ vendorId: 1 });

export const ReturnRequest = mongoose.model<IReturnRequest>("ReturnRequest", returnRequestSchema);
