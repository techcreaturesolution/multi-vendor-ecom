import Razorpay from "razorpay";
import crypto from "crypto";
import { env } from "../config/env";

let _client: Razorpay | null = null;

export function razorpayClient(): Razorpay {
  if (!_client) {
    _client = new Razorpay({
      key_id: env.razorpay.keyId,
      key_secret: env.razorpay.keySecret,
    });
  }
  return _client;
}

export async function createRazorpayOrder(params: {
  amount: number; // in paise
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
}) {
  return razorpayClient().orders.create({
    amount: params.amount,
    currency: params.currency || "INR",
    receipt: params.receipt,
    notes: params.notes,
  });
}

export function verifyRazorpaySignature(params: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const expected = crypto
    .createHmac("sha256", env.razorpay.keySecret)
    .update(`${params.orderId}|${params.paymentId}`)
    .digest("hex");
  return expected === params.signature;
}

/**
 * Issue a refund for a captured Razorpay payment. Amount is in INR; we convert
 * to paise before calling the SDK. If amount is omitted, Razorpay refunds the
 * full captured amount.
 */
export async function refundRazorpayPayment(params: {
  paymentId: string;
  amount?: number; // in INR
  notes?: Record<string, string>;
  speed?: "normal" | "optimum";
}) {
  const body: Record<string, unknown> = {
    speed: params.speed || "normal",
  };
  if (params.amount != null) body.amount = Math.round(params.amount * 100);
  if (params.notes) body.notes = params.notes;
  return razorpayClient().payments.refund(params.paymentId, body);
}

export function verifyWebhookSignature(body: string, signature: string): boolean {
  if (!env.razorpay.webhookSecret) return false;
  const expected = crypto
    .createHmac("sha256", env.razorpay.webhookSecret)
    .update(body)
    .digest("hex");
  return expected === signature;
}
