import { z } from "zod";

export const signupCustomerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().min(7).max(15),
  password: z.string().min(8).max(100),
});

export const signupVendorSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(7).max(15),
  password: z.string().min(8),
  businessName: z.string().min(2),
  businessType: z.string().min(2),
  address: z.object({
    line1: z.string().min(1),
    line2: z.string().optional(),
    city: z.string().min(1),
    state: z.string().min(1),
    pincode: z.string().min(4),
    country: z.string().optional(),
  }),
  bankDetails: z.object({
    accountName: z.string().min(1),
    accountNumber: z.string().min(6),
    ifscCode: z.string().min(6),
    bankName: z.string().min(1),
  }),
  gstNumber: z.string().optional(),
  panNumber: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});
