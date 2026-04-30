import mongoose, { Schema, Document } from "mongoose";

export interface ICampaignStats {
  total: number;
  queued: number;
  sent: number;
  delivered: number;
  read: number;
  failed: number;
}

export interface ICampaign extends Document {
  tenantId: mongoose.Types.ObjectId;
  waAccountId: mongoose.Types.ObjectId;
  name: string;
  templateName: string;
  templateLanguage: string;
  headerParams: string[];
  bodyParams: string[];
  mediaUrl: string;
  contactIds: mongoose.Types.ObjectId[];
  contactTags: string[];
  status: "draft" | "queued" | "in_progress" | "paused" | "completed" | "cancelled";
  scheduledAt: Date | null;
  startedAt: Date | null;
  completedAt: Date | null;
  stats: ICampaignStats;
  createdAt: Date;
  updatedAt: Date;
}

const campaignSchema = new Schema<ICampaign>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    waAccountId: { type: Schema.Types.ObjectId, ref: "WhatsAppAccount", required: true },
    name: { type: String, required: true, trim: true },
    templateName: { type: String, required: true },
    templateLanguage: { type: String, default: "en" },
    headerParams: [{ type: String }],
    bodyParams: [{ type: String }],
    mediaUrl: { type: String, default: "" },
    contactIds: [{ type: Schema.Types.ObjectId, ref: "Contact" }],
    contactTags: [{ type: String }],
    status: {
      type: String,
      enum: ["draft", "queued", "in_progress", "paused", "completed", "cancelled"],
      default: "draft",
    },
    scheduledAt: { type: Date, default: null },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    stats: {
      total: { type: Number, default: 0 },
      queued: { type: Number, default: 0 },
      sent: { type: Number, default: 0 },
      delivered: { type: Number, default: 0 },
      read: { type: Number, default: 0 },
      failed: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

export const Campaign = mongoose.model<ICampaign>("Campaign", campaignSchema);
