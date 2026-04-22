import mongoose, { Schema, Document, Types } from "mongoose";

export interface IPayout extends Document {
  vendorId: Types.ObjectId;
  orderIds: Types.ObjectId[];
  periodStart: Date;
  periodEnd: Date;
  grossSales: number;
  totalShipping: number;
  totalCommission: number;
  netPayable: number;
  status: "pending" | "processing" | "paid" | "failed";
  utrNumber?: string;
  paidAt?: Date;
  notes?: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const payoutSchema = new Schema<IPayout>(
  {
    vendorId: { type: Schema.Types.ObjectId, ref: "Vendor", required: true },
    orderIds: [{ type: Schema.Types.ObjectId, ref: "Order" }],
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    grossSales: { type: Number, required: true },
    totalShipping: { type: Number, required: true },
    totalCommission: { type: Number, required: true },
    netPayable: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "processing", "paid", "failed"],
      default: "pending",
    },
    utrNumber: { type: String },
    paidAt: { type: Date },
    notes: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

payoutSchema.index({ vendorId: 1, createdAt: -1 });
payoutSchema.index({ status: 1 });

export const Payout = mongoose.model<IPayout>("Payout", payoutSchema);
