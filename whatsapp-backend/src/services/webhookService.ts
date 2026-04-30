import { WhatsAppAccount } from "../models/WhatsAppAccount";
import { Contact } from "../models/Contact";
import { Conversation } from "../models/Conversation";
import { Message } from "../models/Message";
import { Campaign } from "../models/Campaign";
import { Tenant } from "../models/Tenant";
import { processAutoReply } from "./autoReplyService";
import { logger } from "../config/logger";

interface WebhookMessage {
  from: string;
  id: string;
  timestamp: string;
  type: string;
  text?: { body: string };
  image?: { id: string; caption?: string };
  video?: { id: string; caption?: string };
  document?: { id: string; filename?: string };
}

interface WebhookStatus {
  id: string;
  status: "sent" | "delivered" | "read" | "failed";
  timestamp: string;
  errors?: Array<{ code: number; title: string }>;
}

export async function handleIncomingMessage(
  accountId: string,
  waMessage: WebhookMessage
) {
  const account = await WhatsAppAccount.findById(accountId);
  if (!account) {
    logger.warn(`No WhatsApp account found for ID: ${accountId}`);
    return;
  }

  const tenantId = account.tenantId.toString();

  let contact = await Contact.findOne({ tenantId, phone: "+" + waMessage.from });
  if (!contact) {
    contact = await Contact.create({
      tenantId,
      name: waMessage.from,
      phone: "+" + waMessage.from,
      source: "api",
    });
  }

  let conversation = await Conversation.findOne({
    tenantId,
    waAccountId: account._id,
    contactId: contact._id,
  });

  if (!conversation) {
    conversation = await Conversation.create({
      tenantId,
      waAccountId: account._id,
      contactId: contact._id,
      lastMessageAt: new Date(),
      lastMessagePreview: waMessage.text?.body?.substring(0, 100) || "[media]",
      unreadCount: 1,
    });
  } else {
    conversation.lastMessageAt = new Date();
    conversation.lastMessagePreview = waMessage.text?.body?.substring(0, 100) || "[media]";
    conversation.unreadCount += 1;
    conversation.status = "open";
    await conversation.save();
  }

  const message = await Message.create({
    tenantId,
    conversationId: conversation._id,
    waAccountId: account._id,
    contactId: contact._id,
    direction: "inbound",
    type: waMessage.type === "text" ? "text" : waMessage.type as "image" | "video" | "document",
    content: waMessage.text?.body || "",
    waMessageId: waMessage.id,
    status: "delivered",
    deliveredAt: new Date(),
  });

  if (waMessage.text?.body) {
    await processAutoReply({
      tenantId,
      waAccountId: account._id.toString(),
      contactPhone: contact.phone,
      incomingText: waMessage.text.body,
    });
  }

  return { message, conversation };
}

export async function handleStatusUpdate(statusUpdate: WebhookStatus) {
  const message = await Message.findOne({ waMessageId: statusUpdate.id });
  if (!message) return;

  const statusOrder = ["queued", "sent", "delivered", "read", "failed"];
  const currentIdx = statusOrder.indexOf(message.status);
  const newIdx = statusOrder.indexOf(statusUpdate.status);

  if (statusUpdate.status === "failed" || newIdx > currentIdx) {
    message.status = statusUpdate.status;

    if (statusUpdate.status === "sent") message.sentAt = new Date();
    if (statusUpdate.status === "delivered") message.deliveredAt = new Date();
    if (statusUpdate.status === "read") message.readAt = new Date();
    if (statusUpdate.status === "failed" && statusUpdate.errors?.[0]) {
      message.errorCode = statusUpdate.errors[0].code.toString();
      message.errorMessage = statusUpdate.errors[0].title;
    }

    await message.save();

    if (message.campaignId) {
      const statField = `stats.${statusUpdate.status}`;
      await Campaign.findByIdAndUpdate(message.campaignId, {
        $inc: { [statField]: 1 },
      });

      if (statusUpdate.status === "sent") {
        await Tenant.findByIdAndUpdate(message.tenantId, {
          $inc: { messagesUsed: 1 },
        });
      }

      const campaign = await Campaign.findById(message.campaignId);
      if (campaign) {
        const totalProcessed = campaign.stats.sent + campaign.stats.failed;
        if (totalProcessed >= campaign.stats.total && campaign.status !== "completed") {
          campaign.status = "completed";
          campaign.completedAt = new Date();
          await campaign.save();
        }
      }
    }
  }
}
