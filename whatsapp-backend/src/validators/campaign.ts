import { z } from "zod";

export const createCampaignSchema = z.object({
  name: z.string().min(1, "Campaign name is required"),
  waAccountId: z.string().min(1, "WhatsApp account is required"),
  templateName: z.string().min(1, "Template name is required"),
  templateLanguage: z.string().default("en"),
  headerParams: z.array(z.string()).optional(),
  bodyParams: z.array(z.string()).optional(),
  mediaUrl: z.string().url().optional().or(z.literal("")),
  contactIds: z.array(z.string()).optional(),
  contactTags: z.array(z.string()).optional(),
  scheduledAt: z.string().datetime().optional(),
});

export const updateCampaignSchema = z.object({
  name: z.string().min(1).optional(),
  templateName: z.string().min(1).optional(),
  templateLanguage: z.string().optional(),
  headerParams: z.array(z.string()).optional(),
  bodyParams: z.array(z.string()).optional(),
  mediaUrl: z.string().url().optional().or(z.literal("")),
  scheduledAt: z.string().datetime().optional().nullable(),
});
