import { Request, Response } from "express";
import { Order } from "../../models/Order";
import { User } from "../../models/User";
import { asyncHandler } from "../../utils/asyncHandler";
import { parsePagination, paginatedResponse } from "../../utils/pagination";
import { getApprovedVendorForRequest } from "./helpers";
import { Types } from "mongoose";

/**
 * List customers who have ordered from this vendor.
 */
export const list = asyncHandler(async (req: Request, res: Response) => {
  const vendor = await getApprovedVendorForRequest(req);
  const p = parsePagination(req);

  const agg = await Order.aggregate([
    { $match: { "vendorSplits.vendorId": vendor._id } },
    {
      $group: {
        _id: "$customerId",
        orderCount: { $sum: 1 },
        totalSpent: { $sum: "$grandTotal" },
        lastOrderAt: { $max: "$placedAt" },
      },
    },
    { $sort: { lastOrderAt: -1 } },
    { $skip: p.skip },
    { $limit: p.limit },
  ]);

  const userIds = agg.map((a) => a._id as Types.ObjectId);
  const users = await User.find({ _id: { $in: userIds } });
  const userMap = new Map(users.map((u) => [String(u._id), u]));

  const data = agg.map((a) => ({
    customer: userMap.get(String(a._id)),
    orderCount: a.orderCount,
    totalSpent: a.totalSpent,
    lastOrderAt: a.lastOrderAt,
  }));

  const totalAgg = await Order.aggregate([
    { $match: { "vendorSplits.vendorId": vendor._id } },
    { $group: { _id: "$customerId" } },
    { $count: "n" },
  ]);
  const total = totalAgg[0]?.n || 0;

  res.json(paginatedResponse(data, total, p));
});
