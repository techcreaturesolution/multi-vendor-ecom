import { AutoReplyRule, IAutoReplyRule } from "../models/AutoReplyRule";
import { AppError } from "../middleware/errorHandler";
import { sendTextMessage, sendTemplateMessage } from "./whatsappApiService";
import { WhatsAppAccount } from "../models/WhatsAppAccount";
import { logger } from "../config/logger";

export async function createRule(tenantId: string, data: {
  name: string;
  waAccountId?: string;
  triggerType: "keyword" | "exact" | "time";
  triggerValue: string;
  responseType?: "text" | "template";
  responseContent: string;
  templateName?: string;
  isActive?: boolean;
  priority?: number;
}) {
  const rule = new AutoReplyRule({
    tenantId,
    waAccountId: data.waAccountId || null,
    name: data.name,
    triggerType: data.triggerType,
    triggerValue: data.triggerValue,
    responseType: data.responseType || "text",
    responseContent: data.responseContent,
    templateName: data.templateName || "",
    isActive: data.isActive !== false,
    priority: data.priority || 0,
  });

  await rule.save();
  return rule;
}

export async function getRules(tenantId: string, waAccountId?: string) {
  const filter: Record<string, unknown> = { tenantId };
  if (waAccountId) filter.$or = [{ waAccountId }, { waAccountId: null }];

  return AutoReplyRule.find(filter).sort({ priority: 1, createdAt: -1 });
}

export async function updateRule(tenantId: string, ruleId: string, data: Partial<IAutoReplyRule>) {
  const rule = await AutoReplyRule.findOneAndUpdate(
    { _id: ruleId, tenantId },
    { $set: data },
    { new: true }
  );
  if (!rule) throw new AppError("Rule not found", 404);
  return rule;
}

export async function deleteRule(tenantId: string, ruleId: string) {
  const rule = await AutoReplyRule.findOneAndDelete({ _id: ruleId, tenantId });
  if (!rule) throw new AppError("Rule not found", 404);
  return { message: "Rule deleted" };
}

export async function processAutoReply(params: {
  tenantId: string;
  waAccountId: string;
  contactPhone: string;
  incomingText: string;
}): Promise<boolean> {
  const rules = await AutoReplyRule.find({
    tenantId: params.tenantId,
    isActive: true,
    $or: [{ waAccountId: params.waAccountId }, { waAccountId: null }],
  }).sort({ priority: 1 });

  for (const rule of rules) {
    const matched = matchRule(rule, params.incomingText);
    if (!matched) continue;

    const account = await WhatsAppAccount.findById(params.waAccountId);
    if (!account) continue;

    try {
      if (rule.responseType === "template" && rule.templateName) {
        await sendTemplateMessage({
          phoneNumberId: account.phoneNumberId,
          accessToken: account.accessToken,
          to: params.contactPhone,
          templateName: rule.templateName,
          languageCode: "en",
        });
      } else {
        await sendTextMessage({
          phoneNumberId: account.phoneNumberId,
          accessToken: account.accessToken,
          to: params.contactPhone,
          text: rule.responseContent,
        });
      }
      return true;
    } catch (error) {
      logger.error("Auto-reply send error:", error);
    }
  }

  return false;
}

function matchRule(rule: IAutoReplyRule, text: string): boolean {
  const lowerText = text.toLowerCase();
  const lowerTrigger = rule.triggerValue.toLowerCase();

  switch (rule.triggerType) {
    case "keyword":
      return lowerText.includes(lowerTrigger);
    case "exact":
      return lowerText === lowerTrigger;
    case "time": {
      const now = new Date();
      const [startStr, endStr] = rule.triggerValue.split("-").map((s) => s.trim());
      if (!startStr || !endStr) return false;
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const [startH, startM] = startStr.split(":").map(Number);
      const [endH, endM] = endStr.split(":").map(Number);
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;
      return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    }
    default:
      return false;
  }
}
