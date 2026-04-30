import mongoose, { Schema, Document } from "mongoose";

export interface ITenant extends Document {
  name: string;
  slug: string;
  createdBy: mongoose.Types.ObjectId;
  plan: "free" | "starter" | "pro" | "enterprise";
  status: "active" | "suspended" | "cancelled";
  messageQuota: number;
  messagesUsed: number;
  createdAt: Date;
  updatedAt: Date;
}

const tenantSchema = new Schema<ITenant>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    plan: {
      type: String,
      enum: ["free", "starter", "pro", "enterprise"],
      default: "free",
    },
    status: {
      type: String,
      enum: ["active", "suspended", "cancelled"],
      default: "active",
    },
    messageQuota: { type: Number, default: 1000 },
    messagesUsed: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Tenant = mongoose.model<ITenant>("Tenant", tenantSchema);
