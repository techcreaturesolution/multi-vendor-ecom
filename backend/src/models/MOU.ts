import mongoose, { Schema, Document, Types } from "mongoose";

export interface IMOU extends Document {
  vendorId: Types.ObjectId;
  adminCommissionPercent: number;
  effectiveFrom: Date;
  effectiveTo?: Date;
  documentUrl?: string;
  terms: string;
  isActive: boolean;
  signedByVendorAt?: Date;
  signedByAdminAt?: Date;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const mouSchema = new Schema<IMOU>(
  {
    vendorId: { type: Schema.Types.ObjectId, ref: "Vendor", required: true },
    adminCommissionPercent: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    effectiveFrom: { type: Date, required: true },
    effectiveTo: { type: Date },
    documentUrl: { type: String },
    terms: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    signedByVendorAt: { type: Date },
    signedByAdminAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

mouSchema.index({ vendorId: 1, isActive: 1 });

export const MOU = mongoose.model<IMOU>("MOU", mouSchema);
