import { z } from "zod";

// Accept either a full ISO 8601 datetime ("2026-04-22T00:00:00.000Z") or a
// date-only string ("2026-04-22") that `new Date(...)` can parse. HTML
// `<input type="date">` emits the latter.
const isoDateLike = z
  .string()
  .min(1)
  .refine((v) => !Number.isNaN(Date.parse(v)), { message: "Invalid date" });

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
  effectiveFrom: isoDateLike,
  effectiveTo: isoDateLike.optional(),
  terms: z.string().min(1),
  documentUrl: z.string().url().optional(),
});

export const updateMouSchema = z
  .object({
    adminCommissionPercent: z.number().min(0).max(100).optional(),
    effectiveFrom: isoDateLike.optional(),
    effectiveTo: isoDateLike.nullable().optional(),
    terms: z.string().min(1).optional(),
    documentUrl: z.string().url().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "No fields to update" });

export const updateUserStatusSchema = z.object({
  isActive: z.boolean(),
});

export const generatePayoutSchema = z.object({
  vendorId: z.string().min(1),
  periodStart: isoDateLike,
  periodEnd: isoDateLike,
});

export const markPayoutPaidSchema = z.object({
  utrNumber: z.string().min(1),
});

export const setReturnStatusSchema = z.object({
  status: z.enum(["approved", "rejected", "picked_up", "received", "refunded"]),
  vendorNote: z.string().optional(),
  refundAmount: z.number().min(0).optional(),
});

export { isoDateLike };
