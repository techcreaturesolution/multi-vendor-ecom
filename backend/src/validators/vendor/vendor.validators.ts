import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(2).max(200),
  slug: z.string().min(2).max(200).regex(/^[a-z0-9-]+$/),
  description: z.string().min(10),
  shortDescription: z.string().optional(),
  categoryId: z.string().min(1),
  // Accept either absolute URLs (CDN / remote) or relative paths served by
  // the backend at /uploads/... so our internal upload endpoint works.
  images: z
    .array(
      z.string().refine((v) => /^https?:\/\//.test(v) || v.startsWith("/uploads/"), {
        message: "Image must be an absolute URL or /uploads/... path",
      })
    )
    .default([]),
  price: z.number().min(0),
  compareAtPrice: z.number().min(0).optional(),
  sku: z.string().min(1),
  stock: z.number().int().min(0),
  lowStockThreshold: z.number().int().min(0).optional(),
  weight: z.number().min(0).optional(),
  dimensions: z
    .object({
      length: z.number().min(0),
      width: z.number().min(0),
      height: z.number().min(0),
    })
    .optional(),
  tags: z.array(z.string()).optional(),
  variants: z
    .array(
      z.object({
        sku: z.string().min(1),
        attributes: z.record(z.string(), z.string()).default({}),
        price: z.number().min(0),
        stock: z.number().int().min(0),
        image: z
          .string()
          .refine((v) => /^https?:\/\//.test(v) || v.startsWith("/uploads/"), {
            message: "Image must be an absolute URL or /uploads/... path",
          })
          .optional(),
      })
    )
    .optional(),
  isActive: z.boolean().optional(),
});

export const updateProductSchema = createProductSchema.partial();

export const markShippedSchema = z.object({
  courierCode: z.string().optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(["processing", "shipped", "out_for_delivery", "delivered", "cancelled"]),
  note: z.string().optional(),
});

export const uploadKycSchema = z.object({
  docType: z.string().min(1),
  fileUrl: z.string().url(),
});
