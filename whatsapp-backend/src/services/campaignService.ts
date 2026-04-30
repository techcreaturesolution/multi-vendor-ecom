import { Campaign } from "../models/Campaign";
import { Contact } from "../models/Contact";
import { Message } from "../models/Message";
import { WhatsAppAccount } from "../models/WhatsAppAccount";
import { Tenant } from "../models/Tenant";
import { AppError } from "../middleware/errorHandler";
import { campaignQueue } from "../queues/campaignQueue";

export async function createCampaign(tenantId: string, data: {
  name: string;
  waAccountId: string;
  templateName: string;
  templateLanguage?: string;
  headerParams?: string[];
  bodyParams?: string[];
  mediaUrl?: string;
  contactIds?: string[];
  contactTags?: string[];
  scheduledAt?: string;
}) {
  const account = await WhatsAppAccount.findOne({ _id: data.waAccountId, tenantId });
  if (!account) throw new AppError("WhatsApp account not found", 404);

  let contactIds = data.contactIds || [];

  if (data.contactTags && data.contactTags.length > 0 && contactIds.length === 0) {
    const tagContacts = await Contact.find({
      tenantId,
      tags: { $in: data.contactTags },
    }).select("_id");
    contactIds = tagContacts.map((c) => c._id.toString());
  }

  if (contactIds.length === 0) {
    throw new AppError("No contacts selected for campaign", 400);
  }

  const campaign = new Campaign({
    tenantId,
    waAccountId: data.waAccountId,
    name: data.name,
    templateName: data.templateName,
    templateLanguage: data.templateLanguage || "en",
    headerParams: data.headerParams || [],
    bodyParams: data.bodyParams || [],
    mediaUrl: data.mediaUrl || "",
    contactIds,
    contactTags: data.contactTags || [],
    scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
    stats: { total: contactIds.length, queued: 0, sent: 0, delivered: 0, read: 0, failed: 0 },
  });

  await campaign.save();
  return campaign;
}

export async function startCampaign(tenantId: string, campaignId: string) {
  const campaign = await Campaign.findOne({ _id: campaignId, tenantId });
  if (!campaign) throw new AppError("Campaign not found", 404);
  if (campaign.status !== "draft" && campaign.status !== "paused") {
    throw new AppError("Campaign cannot be started in its current state", 400);
  }

  const tenant = await Tenant.findById(tenantId);
  if (!tenant) throw new AppError("Tenant not found", 404);

  const remaining = tenant.messageQuota - tenant.messagesUsed;
  if (remaining < campaign.contactIds.length) {
    throw new AppError(`Insufficient message quota. Need ${campaign.contactIds.length}, have ${remaining}`, 400);
  }

  campaign.status = "queued";
  campaign.startedAt = new Date();
  await campaign.save();

  const contacts = await Contact.find({ _id: { $in: campaign.contactIds } });
  const account = await WhatsAppAccount.findById(campaign.waAccountId);
  if (!account) throw new AppError("WhatsApp account not found", 404);

  const messages = contacts.map((contact) => ({
    tenantId,
    campaignId: campaign._id,
    waAccountId: campaign.waAccountId,
    contactId: contact._id,
    direction: "outbound" as const,
    type: "template" as const,
    content: campaign.templateName,
    status: "queued" as const,
  }));

  const insertedMessages = await Message.insertMany(messages);

  campaign.stats.queued = insertedMessages.length;
  await campaign.save();

  for (const msg of insertedMessages) {
    const contact = contacts.find((c) => c._id.toString() === msg.contactId.toString());
    if (!contact) continue;

    await campaignQueue.add("send-message", {
      messageId: msg._id.toString(),
      phoneNumberId: account.phoneNumberId,
      accessToken: account.accessToken,
      to: contact.phone,
      templateName: campaign.templateName,
      languageCode: campaign.templateLanguage,
      headerParams: campaign.headerParams,
      bodyParams: campaign.bodyParams,
      mediaUrl: campaign.mediaUrl,
      campaignId: campaign._id.toString(),
      tenantId,
    }, {
      attempts: 3,
      backoff: { type: "exponential", delay: 5000 },
    });
  }

  return campaign;
}

export async function pauseCampaign(tenantId: string, campaignId: string) {
  const campaign = await Campaign.findOneAndUpdate(
    { _id: campaignId, tenantId, status: { $in: ["queued", "in_progress"] } },
    { status: "paused" },
    { new: true }
  );
  if (!campaign) throw new AppError("Campaign not found or cannot be paused", 404);
  return campaign;
}

export async function cancelCampaign(tenantId: string, campaignId: string) {
  const campaign = await Campaign.findOneAndUpdate(
    { _id: campaignId, tenantId, status: { $in: ["draft", "queued", "in_progress", "paused"] } },
    { status: "cancelled" },
    { new: true }
  );
  if (!campaign) throw new AppError("Campaign not found or cannot be cancelled", 404);
  return campaign;
}

export async function getCampaigns(tenantId: string, query: {
  page?: number;
  limit?: number;
  status?: string;
}) {
  const page = query.page || 1;
  const limit = query.limit || 20;
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = { tenantId };
  if (query.status) filter.status = query.status;

  const [campaigns, total] = await Promise.all([
    Campaign.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("waAccountId", "name phoneNumber"),
    Campaign.countDocuments(filter),
  ]);

  return { campaigns, total, page, totalPages: Math.ceil(total / limit) };
}

export async function getCampaignById(tenantId: string, campaignId: string) {
  const campaign = await Campaign.findOne({ _id: campaignId, tenantId })
    .populate("waAccountId", "name phoneNumber");
  if (!campaign) throw new AppError("Campaign not found", 404);

  const messages = await Message.find({ campaignId })
    .populate("contactId", "name phone")
    .sort({ createdAt: -1 })
    .limit(100);

  return { campaign, messages };
}
