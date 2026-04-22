import { Request, Response } from "express";
import { Order } from "../../models/Order";
import { Payout } from "../../models/Payout";
import { asyncHandler } from "../../utils/asyncHandler";
import { parsePagination, paginatedResponse } from "../../utils/pagination";
import { getApprovedVendorForRequest } from "./helpers";

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

  const buckets: Record<string, { count: number; gross: number; net: number }> = {};
  for (const a of agg) {
    buckets[a._id as string] = { count: a.count, gross: a.gross, net: a.net };
  }

  res.json({
    success: true,
    data: {
      vendorId: vendor._id,
      pending: buckets.pending || { count: 0, gross: 0, net: 0 },
      processing: buckets.processing || { count: 0, gross: 0, net: 0 },
      paid: buckets.paid || { count: 0, gross: 0, net: 0 },
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
