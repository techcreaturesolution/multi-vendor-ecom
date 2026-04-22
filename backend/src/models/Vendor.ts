import mongoose, { Schema, Document, Types } from "mongoose";

export type VendorStatus = "pending" | "approved" | "rejected" | "suspended";

export interface IVendor extends Document {
  userId: Types.ObjectId;
  businessName: string;
  businessType: string;
  gstNumber?: string;
  panNumber?: string;
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  bankDetails: {
    accountName: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
  };
  kycDocuments: {
    docType: string;
    fileUrl: string;
    uploadedAt: Date;
    verifiedAt?: Date;
    status: "pending" | "approved" | "rejected";
  }[];
  status: VendorStatus;
  approvedAt?: Date;
  approvedBy?: Types.ObjectId;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const vendorSchema = new Schema<IVendor>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    businessName: { type: String, required: true, trim: true },
    businessType: { type: String, required: true },
    gstNumber: { type: String },
    panNumber: { type: String },
    address: {
      line1: { type: String, required: true },
      line2: { type: String },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
      country: { type: String, default: "India" },
    },
    bankDetails: {
      accountName: { type: String, required: true },
      accountNumber: { type: String, required: true },
      ifscCode: { type: String, required: true },
      bankName: { type: String, required: true },
    },
    kycDocuments: [
      {
        docType: { type: String, required: true },
        fileUrl: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now },
        verifiedAt: { type: Date },
        status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
      },
    ],
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "suspended"],
      default: "pending",
    },
    approvedAt: { type: Date },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    rejectionReason: { type: String },
  },
  { timestamps: true }
);

vendorSchema.index({ userId: 1 });
vendorSchema.index({ status: 1 });

export const Vendor = mongoose.model<IVendor>("Vendor", vendorSchema);
