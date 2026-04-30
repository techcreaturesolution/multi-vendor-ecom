import mongoose, { Schema, Document } from "mongoose";

export interface IConversation extends Document {
  tenantId: mongoose.Types.ObjectId;
  waAccountId: mongoose.Types.ObjectId;
  contactId: mongoose.Types.ObjectId;
  lastMessageAt: Date;
  lastMessagePreview: string;
  unreadCount: number;
  assignedAgentId: mongoose.Types.ObjectId | null;
  status: "open" | "closed";
  createdAt: Date;
  updatedAt: Date;
}

const conversationSchema = new Schema<IConversation>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    waAccountId: { type: Schema.Types.ObjectId, ref: "WhatsAppAccount", required: true },
    contactId: { type: Schema.Types.ObjectId, ref: "Contact", required: true },
    lastMessageAt: { type: Date, default: Date.now },
    lastMessagePreview: { type: String, default: "" },
    unreadCount: { type: Number, default: 0 },
    assignedAgentId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    status: { type: String, enum: ["open", "closed"], default: "open" },
  },
  { timestamps: true }
);

conversationSchema.index({ tenantId: 1, waAccountId: 1, contactId: 1 }, { unique: true });
conversationSchema.index({ tenantId: 1, lastMessageAt: -1 });

export const Conversation = mongoose.model<IConversation>("Conversation", conversationSchema);
