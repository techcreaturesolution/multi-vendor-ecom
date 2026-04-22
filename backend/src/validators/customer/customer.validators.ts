import { z } from "zod";

export const addToCartSchema = z.object({
  productId: z.string().min(1),
  variantSku: z.string().min(1).optional(),
  quantity: z.number().int().min(1).max(100),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(0).max(100),
  variantSku: z.string().min(1).optional(),
});

export const addressSchema = z.object({
  label: z.string().optional(),
  fullName: z.string().min(1),
  phone: z.string().min(7),
  line1: z.string().min(1),
  line2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  pincode: z.string().min(4),
  country: z.string().optional(),
  isDefault: z.boolean().optional(),
});

export const getShippingRatesSchema = z.object({
  pincode: z.string().min(4),
});

export const checkoutSchema = z.object({
  addressId: z.string().min(1),
});

export const verifyPaymentSchema = z.object({
  orderId: z.string().min(1),
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
});

export const createReviewSchema = z.object({
  productId: z.string().min(1),
  orderId: z.string().min(1),
  rating: z.number().min(1).max(5),
  title: z.string().optional(),
  comment: z.string().optional(),
  images: z.array(z.string().url()).optional(),
});

export const createReturnSchema = z.object({
  orderId: z.string().min(1),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().min(1),
        reason: z.string().min(1),
      })
    )
    .min(1),
});
