import { z } from "zod";

export const createAutoReplySchema = z.object({
  name: z.string().min(1, "Rule name is required"),
  waAccountId: z.string().optional(),
  triggerType: z.enum(["keyword", "exact", "time"]),
  triggerValue: z.string().min(1, "Trigger value is required"),
  responseType: z.enum(["text", "template"]).default("text"),
  responseContent: z.string().min(1, "Response content is required"),
  templateName: z.string().optional(),
  isActive: z.boolean().default(true),
  priority: z.number().int().min(0).default(0),
});

export const updateAutoReplySchema = z.object({
  name: z.string().min(1).optional(),
  triggerType: z.enum(["keyword", "exact", "time"]).optional(),
  triggerValue: z.string().min(1).optional(),
  responseType: z.enum(["text", "template"]).optional(),
  responseContent: z.string().min(1).optional(),
  templateName: z.string().optional(),
  isActive: z.boolean().optional(),
  priority: z.number().int().min(0).optional(),
});
