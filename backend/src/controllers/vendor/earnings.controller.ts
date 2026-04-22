import { Request, Response } from "express";
import { Order } from "../../models/Order";
import { Payout } from "../../models/Payout";
import { asyncHandler } from "../../utils/asyncHandler";
import { parsePagination, paginatedResponse } from "../../utils/pagination";
import { getApprovedVendorForRequest } from "./helpers";

interface Bucket {
  count: number;
  gross: number;
  shipping: number;
  commission: number;
  net: number;
}

const emptyBucket: Bucket = { count: 0, gross: 0, shipping: 0, commission: 0, net: 0 };

export const summary = asyncHandler(async (req: Request, res: Response) => {
  const vendor = await getApprovedVendorForRequest(req);

  const agg = await Order.aggregate([
    { $match: { paymentStatus: "paid", "vendorSplits.vendorId": vendor._id } },
    { $unwind: "$vendorSplits" },
    { $match: { "vendorSplits.vendorId": vendor._id } },
    {
      $group: {
        _id: "$vendorSplits.payoutStatus",
        count: { $sum: 1 },
        gross: { $sum: "$vendorSplits.subtotal" },
        commission: { $sum: "$vendorSplits.adminCommissionAmount" },
        shipping: { $sum: "$vendorSplits.shippingCost" },
        net: { $sum: "$vendorSplits.vendorNetAmount" },
      },
    },
  ]);

  const buckets: Record<string, Bucket> = {};
  for (const a of agg) {
    buckets[a._id as string] = {
      count: a.count,
      gross: a.gross,
      shipping: a.shipping,
      commission: a.commission,
      net: a.net,
    };
  }
  const pending = buckets.pending || emptyBucket;
  const processing = buckets.processing || emptyBucket;
  const paid = buckets.paid || emptyBucket;

  const grossSales = pending.gross + processing.gross + paid.gross;
  const totalShipping = pending.shipping + processing.shipping + paid.shipping;
  const totalCommission = pending.commission + processing.commission + paid.commission;
  const netEarnings = pending.net + processing.net + paid.net;

  res.json({
    success: true,
    data: {
      vendorId: vendor._id,
      grossSales,
      totalShipping,
      totalCommission,
      netEarnings,
      pendingPayout: pending.net,
      paidOut: paid.net,
      // Raw buckets kept for future UIs that want per-status breakdowns.
      buckets: { pending, processing, paid },
    },
  });
});

export const payouts = asyncHandler(async (req: Request, res: Response) => {
  const vendor = await getApprovedVendorForRequest(req);
  const p = parsePagination(req);
  const [items, total] = await Promise.all([
    Payout.find({ vendorId: vendor._id }).sort({ createdAt: -1 }).skip(p.skip).limit(p.limit),
    Payout.countDocuments({ vendorId: vendor._id }),
  ]);
  res.json(paginatedResponse(items, total, p));
});
