import mongoose, { Schema, Document } from "mongoose";

export interface IWhatsAppAccount extends Document {
  tenantId: mongoose.Types.ObjectId;
  name: string;
  phoneNumber: string;
  phoneNumberId: string;
  wabaId: string;
  accessToken: string;
  webhookVerified: boolean;
  status: "active" | "inactive" | "disconnected";
  createdAt: Date;
  updatedAt: Date;
}

const whatsAppAccountSchema = new Schema<IWhatsAppAccount>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    name: { type: String, required: true, trim: true },
    phoneNumber: { type: String, required: true },
    phoneNumberId: { type: String, required: true },
    wabaId: { type: String, required: true },
    accessToken: { type: String, required: true },
    webhookVerified: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["active", "inactive", "disconnected"],
      default: "active",
    },
  },
  { timestamps: true }
);

whatsAppAccountSchema.index({ tenantId: 1, phoneNumberId: 1 }, { unique: true });

export const WhatsAppAccount = mongoose.model<IWhatsAppAccount>(
  "WhatsAppAccount",
  whatsAppAccountSchema
);
