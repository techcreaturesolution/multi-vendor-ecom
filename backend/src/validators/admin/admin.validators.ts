import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  image: z.string().url().optional(),
  parentId: z.string().optional().nullable(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

export const approveVendorSchema = z.object({
  approved: z.boolean(),
  rejectionReason: z.string().optional(),
});

export const createMouSchema = z.object({
  vendorId: z.string().min(1),
  adminCommissionPercent: z.number().min(0).max(100),
  effectiveFrom: z.string().datetime(),
  effectiveTo: z.string().datetime().optional(),
  terms: z.string().min(1),
  documentUrl: z.string().url().optional(),
});

export const updateUserStatusSchema = z.object({
  isActive: z.boolean(),
});

export const generatePayoutSchema = z.object({
  vendorId: z.string().min(1),
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
});

export const markPayoutPaidSchema = z.object({
  utrNumber: z.string().min(1),
});
