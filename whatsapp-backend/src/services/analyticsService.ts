import mongoose from "mongoose";
import { Campaign } from "../models/Campaign";
import { Message } from "../models/Message";
import { Tenant } from "../models/Tenant";
import { Conversation } from "../models/Conversation";

export async function getTenantDashboard(tenantId: string) {
  const tid = new mongoose.Types.ObjectId(tenantId);

  const [
    tenant,
    totalCampaigns,
    activeCampaigns,
    totalContacts,
    totalConversations,
    unreadConversations,
    messageStats,
  ] = await Promise.all([
    Tenant.findById(tenantId),
    Campaign.countDocuments({ tenantId: tid }),
    Campaign.countDocuments({ tenantId: tid, status: { $in: ["queued", "in_progress"] } }),
    mongoose.model("Contact").countDocuments({ tenantId: tid }),
    Conversation.countDocuments({ tenantId: tid }),
    Conversation.countDocuments({ tenantId: tid, unreadCount: { $gt: 0 } }),
    Message.aggregate([
      { $match: { tenantId: tid } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  const stats: Record<string, number> = {};
  for (const s of messageStats) {
    stats[s._id] = s.count;
  }

  return {
    tenant: {
      name: tenant?.name,
      plan: tenant?.plan,
      messagesUsed: tenant?.messagesUsed,
      messageQuota: tenant?.messageQuota,
    },
    campaigns: { total: totalCampaigns, active: activeCampaigns },
    contacts: { total: totalContacts },
    conversations: { total: totalConversations, unread: unreadConversations },
    messages: {
      sent: stats.sent || 0,
      delivered: stats.delivered || 0,
      read: stats.read || 0,
      failed: stats.failed || 0,
      queued: stats.queued || 0,
    },
  };
}

export async function getCampaignReport(tenantId: string, campaignId: string) {
  const cid = new mongoose.Types.ObjectId(campaignId);

  const campaign = await Campaign.findOne({ _id: cid, tenantId })
    .populate("waAccountId", "name phoneNumber");
  if (!campaign) return null;

  const messageBreakdown = await Message.aggregate([
    { $match: { campaignId: cid } },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  const hourlyDistribution = await Message.aggregate([
    { $match: { campaignId: cid, sentAt: { $ne: null } } },
    {
      $group: {
        _id: { $hour: "$sentAt" },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return {
    campaign,
    messageBreakdown: messageBreakdown.reduce(
      (acc, item) => ({ ...acc, [item._id]: item.count }),
      {} as Record<string, number>
    ),
    hourlyDistribution: hourlyDistribution.map((h) => ({
      hour: h._id,
      count: h.count,
    })),
  };
}

export async function getMessageTrend(tenantId: string, days: number = 30) {
  const tid = new mongoose.Types.ObjectId(tenantId);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const trend = await Message.aggregate([
    { $match: { tenantId: tid, createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          direction: "$direction",
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id.date": 1 } },
  ]);

  return trend.map((t) => ({
    date: t._id.date,
    direction: t._id.direction,
    count: t.count,
  }));
}

export async function getSuperAdminDashboard() {
  const [
    totalTenants,
    activeTenants,
    totalMessages,
    totalCampaigns,
  ] = await Promise.all([
    Tenant.countDocuments(),
    Tenant.countDocuments({ status: "active" }),
    Message.countDocuments(),
    Campaign.countDocuments(),
  ]);

  const tenantsByPlan = await Tenant.aggregate([
    { $group: { _id: "$plan", count: { $sum: 1 } } },
  ]);

  return {
    tenants: { total: totalTenants, active: activeTenants },
    messages: { total: totalMessages },
    campaigns: { total: totalCampaigns },
    tenantsByPlan: tenantsByPlan.reduce(
      (acc, item) => ({ ...acc, [item._id]: item.count }),
      {} as Record<string, number>
    ),
  };
}
