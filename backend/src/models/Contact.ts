import mongoose, { Schema, Document } from "mongoose";

export interface IContact extends Document {
  tenantId: mongoose.Types.ObjectId;
  name: string;
  phone: string;
  email: string;
  tags: string[];
  source: "manual" | "excel" | "api";
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

const contactSchema = new Schema<IContact>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true },
    email: { type: String, default: "", trim: true },
    tags: [{ type: String, trim: true }],
    source: {
      type: String,
      enum: ["manual", "excel", "api"],
      default: "manual",
    },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

contactSchema.index({ tenantId: 1, phone: 1 }, { unique: true });

export const Contact = mongoose.model<IContact>("Contact", contactSchema);
