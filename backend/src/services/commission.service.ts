import { MOU } from "../models/MOU";
import { Types } from "mongoose";

/**
 * Look up the active commission percentage for a vendor at a given time.
 * Defaults to 10% if no active MOU is found (admin should always create one).
 */
export async function getActiveCommissionPercent(
  vendorId: Types.ObjectId | string,
  at: Date = new Date()
): Promise<number> {
  const mou = await MOU.findOne({
    vendorId,
    isActive: true,
    effectiveFrom: { $lte: at },
    $or: [{ effectiveTo: null }, { effectiveTo: { $gte: at } }],
  })
    .sort({ effectiveFrom: -1 })
    .lean();
  return mou?.adminCommissionPercent ?? 10;
}

/**
 * Compute a vendor-level split given the vendor's subtotal, the shipping cost
 * attributed to that vendor, and the commission percent.
 *
 * Commission is taken on (subtotal - shippingCost), i.e. on the goods revenue
 * only. Shipping is a pass-through cost: it is charged to the vendor's split
 * (the platform collects it from the customer and pays the courier, then
 * records it as a reduction in vendor net).
 */
export function computeSplit(params: {
  subtotal: number;
  shippingCost: number;
  adminCommissionPercent: number;
}): { adminCommissionAmount: number; vendorNetAmount: number } {
  const { subtotal, shippingCost, adminCommissionPercent } = params;
  const goodsRevenue = Math.max(0, subtotal);
  const adminCommissionAmount = round2((goodsRevenue * adminCommissionPercent) / 100);
  const vendorNetAmount = round2(subtotal - shippingCost - adminCommissionAmount);
  return { adminCommissionAmount, vendorNetAmount };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
