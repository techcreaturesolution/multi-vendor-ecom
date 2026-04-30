import { z } from "zod";

export const addWhatsAppAccountSchema = z.object({
  name: z.string().min(1, "Account name is required"),
  phoneNumber: z.string().min(10, "Valid phone number is required"),
  phoneNumberId: z.string().min(1, "Phone Number ID is required"),
  wabaId: z.string().min(1, "WABA ID is required"),
  accessToken: z.string().min(1, "Access token is required"),
});

export const updateWhatsAppAccountSchema = z.object({
  name: z.string().min(1).optional(),
  accessToken: z.string().min(1).optional(),
  status: z.enum(["active", "inactive"]).optional(),
});
