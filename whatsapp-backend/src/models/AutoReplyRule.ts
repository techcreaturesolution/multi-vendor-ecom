import mongoose, { Schema, Document } from "mongoose";

export interface IAutoReplyRule extends Document {
  tenantId: mongoose.Types.ObjectId;
  waAccountId: mongoose.Types.ObjectId | null;
  name: string;
  triggerType: "keyword" | "exact" | "time";
  triggerValue: string;
  responseType: "text" | "template";
  responseContent: string;
  templateName: string;
  isActive: boolean;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
}

const autoReplyRuleSchema = new Schema<IAutoReplyRule>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    waAccountId: { type: Schema.Types.ObjectId, ref: "WhatsAppAccount", default: null },
    name: { type: String, required: true, trim: true },
    triggerType: {
      type: String,
      enum: ["keyword", "exact", "time"],
      required: true,
    },
    triggerValue: { type: String, required: true },
    responseType: {
      type: String,
      enum: ["text", "template"],
      default: "text",
    },
    responseContent: { type: String, required: true },
    templateName: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
    priority: { type: Number, default: 0 },
  },
  { timestamps: true }
);

autoReplyRuleSchema.index({ tenantId: 1, priority: 1 });

export const AutoReplyRule = mongoose.model<IAutoReplyRule>("AutoReplyRule", autoReplyRuleSchema);
