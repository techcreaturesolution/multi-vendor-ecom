import mongoose, { Schema, Document } from "mongoose";

export interface IMessage extends Document {
  tenantId: mongoose.Types.ObjectId;
  campaignId: mongoose.Types.ObjectId | null;
  conversationId: mongoose.Types.ObjectId | null;
  waAccountId: mongoose.Types.ObjectId;
  contactId: mongoose.Types.ObjectId;
  direction: "outbound" | "inbound";
  type: "template" | "text" | "image" | "video" | "document" | "audio";
  content: string;
  mediaUrl: string;
  waMessageId: string;
  status: "queued" | "sent" | "delivered" | "read" | "failed";
  errorCode: string;
  errorMessage: string;
  sentAt: Date | null;
  deliveredAt: Date | null;
  readAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    campaignId: { type: Schema.Types.ObjectId, ref: "Campaign", default: null, index: true },
    conversationId: { type: Schema.Types.ObjectId, ref: "Conversation", default: null, index: true },
    waAccountId: { type: Schema.Types.ObjectId, ref: "WhatsAppAccount", required: true },
    contactId: { type: Schema.Types.ObjectId, ref: "Contact", required: true },
    direction: { type: String, enum: ["outbound", "inbound"], required: true },
    type: {
      type: String,
      enum: ["template", "text", "image", "video", "document", "audio"],
      default: "text",
    },
    content: { type: String, default: "" },
    mediaUrl: { type: String, default: "" },
    waMessageId: { type: String, default: "", index: true },
    status: {
      type: String,
      enum: ["queued", "sent", "delivered", "read", "failed"],
      default: "queued",
    },
    errorCode: { type: String, default: "" },
    errorMessage: { type: String, default: "" },
    sentAt: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },
    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);

messageSchema.index({ waAccountId: 1, createdAt: -1 });
messageSchema.index({ contactId: 1, createdAt: -1 });

export const Message = mongoose.model<IMessage>("Message", messageSchema);
