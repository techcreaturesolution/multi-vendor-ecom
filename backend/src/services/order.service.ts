import { Types } from "mongoose";
import { Order, IOrderItem, IVendorSplit } from "../models/Order";
import { Product } from "../models/Product";
import { getActiveCommissionPercent, computeSplit } from "./commission.service";
import { ApiError } from "../utils/apiError";

export function generateOrderNumber(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = Math.floor(Math.random() * 1_000_000)
    .toString()
    .padStart(6, "0");
  return `MVE-${y}${m}${d}-${rand}`;
}

export interface BuildOrderInput {
  customerId: Types.ObjectId | string;
  items: { productId: string; quantity: number; variantSku?: string }[];
  shippingAddress: {
    fullName: string;
    phone: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
    country?: string;
  };
  /**
   * Map of vendorId -> shipping cost for that vendor (INR). Caller should
   * compute these via the courier provider's rate quote per vendor group.
   * Pass an empty object to defer shipping (shippingTotal = 0).
   */
  vendorShippingCosts?: Record<string, number>;
}

/**
 * Build a new Order document (not saved) from cart-style input. Validates
 * products, groups items per vendor, computes vendor splits with active MOU
 * commission, and computes totals.
 */
export async function buildOrder(input: BuildOrderInput) {
  if (!input.items.length) throw ApiError.badRequest("Cart is empty");

  const productIds = input.items.map((i) => new Types.ObjectId(i.productId));
  const products = await Product.find({ _id: { $in: productIds }, isActive: true });
  const productMap = new Map(products.map((p) => [String(p._id), p]));

  const items: IOrderItem[] = [];
  const perVendor = new Map<string, { subtotal: number; vendorId: Types.ObjectId }>();

  for (const line of input.items) {
    const p = productMap.get(line.productId);
    if (!p) throw ApiError.badRequest(`Product not found or inactive: ${line.productId}`);

    let price = p.price;
    let availableStock = p.stock;
    let variantSku: string | undefined;
    let variantAttributes: Record<string, string> | undefined;
    let image = p.images?.[0];

    if (line.variantSku) {
      const variant = p.variants?.find((v) => v.sku === line.variantSku);
      if (!variant) {
        throw ApiError.badRequest(
          `Variant ${line.variantSku} not found on ${p.name}`
        );
      }
      price = variant.price;
      availableStock = variant.stock;
      variantSku = variant.sku;
      variantAttributes = variant.attributes;
      if (variant.image) image = variant.image;
    } else if (p.variants && p.variants.length > 0) {
      throw ApiError.badRequest(`Please select a variant for ${p.name}`);
    }

    if (availableStock < line.quantity) {
      throw ApiError.badRequest(`Insufficient stock for ${p.name}`);
    }
    const subtotal = round2(price * line.quantity);
    items.push({
      productId: p._id as Types.ObjectId,
      vendorId: p.vendorId,
      name: p.name,
      sku: p.sku,
      variantSku,
      variantAttributes,
      image,
      quantity: line.quantity,
      price,
      subtotal,
    });
    const key = String(p.vendorId);
    const existing = perVendor.get(key);
    if (existing) {
      existing.subtotal = round2(existing.subtotal + subtotal);
    } else {
      perVendor.set(key, { subtotal, vendorId: p.vendorId });
    }
  }

  const vendorSplits: IVendorSplit[] = [];
  let subtotal = 0;
  let shippingTotal = 0;

  for (const [vendorKey, agg] of perVendor.entries()) {
    const shippingCost = round2(input.vendorShippingCosts?.[vendorKey] ?? 0);
    const pct = await getActiveCommissionPercent(agg.vendorId);
    const split = computeSplit({
      subtotal: agg.subtotal,
      shippingCost,
      adminCommissionPercent: pct,
    });
    vendorSplits.push({
      vendorId: agg.vendorId,
      subtotal: agg.subtotal,
      shippingCost,
      adminCommissionPercent: pct,
      adminCommissionAmount: split.adminCommissionAmount,
      vendorNetAmount: split.vendorNetAmount,
      payoutStatus: "pending",
    });
    subtotal = round2(subtotal + agg.subtotal);
    shippingTotal = round2(shippingTotal + shippingCost);
  }

  const grandTotal = round2(subtotal + shippingTotal);

  const order = new Order({
    orderNumber: generateOrderNumber(),
    customerId: input.customerId,
    items,
    vendorSplits,
    shippingAddress: {
      ...input.shippingAddress,
      country: input.shippingAddress.country || "India",
    },
    subtotal,
    shippingTotal,
    taxTotal: 0,
    discountTotal: 0,
    grandTotal,
    status: "pending_payment",
    paymentStatus: "pending",
  });

  return order;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
