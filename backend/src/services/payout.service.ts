import { Types } from "mongoose";
import { Order } from "../models/Order";
import { Payout } from "../models/Payout";
import { ApiError } from "../utils/apiError";

/**
 * Aggregate all eligible (delivered, unpaid) order splits for a vendor within
 * a date range into a single Payout record. Marks the included vendorSplits as
 * payoutStatus=processing and attaches the payoutId.
 */
export async function generateVendorPayout(params: {
  vendorId: Types.ObjectId | string;
  periodStart: Date;
  periodEnd: Date;
  createdBy: Types.ObjectId | string;
}) {
  const vendorObjId = new Types.ObjectId(params.vendorId);
  const orders = await Order.find({
    status: "delivered",
    "vendorSplits.vendorId": vendorObjId,
    "vendorSplits.payoutStatus": "pending",
    placedAt: { $gte: params.periodStart, $lte: params.periodEnd },
  });

  if (!orders.length) {
    throw ApiError.badRequest("No eligible delivered orders in this period");
  }

  let grossSales = 0;
  let totalShipping = 0;
  let totalCommission = 0;
  let netPayable = 0;
  const orderIds: Types.ObjectId[] = [];

  for (const o of orders) {
    const split = o.vendorSplits.find(
      (s) => String(s.vendorId) === String(vendorObjId) && s.payoutStatus === "pending"
    );
    if (!split) continue;
    grossSales = round2(grossSales + split.subtotal);
    totalShipping = round2(totalShipping + split.shippingCost);
    totalCommission = round2(totalCommission + split.adminCommissionAmount);
    netPayable = round2(netPayable + split.vendorNetAmount);
    orderIds.push(o._id as Types.ObjectId);
  }

  if (netPayable <= 0) throw ApiError.badRequest("Net payable is zero");

  const payout = await Payout.create({
    vendorId: vendorObjId,
    orderIds,
    periodStart: params.periodStart,
    periodEnd: params.periodEnd,
    grossSales,
    totalShipping,
    totalCommission,
    netPayable,
    status: "processing",
    createdBy: params.createdBy,
  });

  await Order.updateMany(
    { _id: { $in: orderIds }, "vendorSplits.vendorId": vendorObjId },
    {
      $set: {
        "vendorSplits.$[elem].payoutStatus": "processing",
        "vendorSplits.$[elem].payoutId": payout._id,
      },
    },
    { arrayFilters: [{ "elem.vendorId": vendorObjId }] }
  );

  return payout;
}

export async function markPayoutPaid(payoutId: string, utrNumber: string) {
  const payout = await Payout.findById(payoutId);
  if (!payout) throw ApiError.notFound("Payout not found");
  payout.status = "paid";
  payout.utrNumber = utrNumber;
  payout.paidAt = new Date();
  await payout.save();

  await Order.updateMany(
    { _id: { $in: payout.orderIds }, "vendorSplits.vendorId": payout.vendorId },
    { $set: { "vendorSplits.$[elem].payoutStatus": "paid" } },
    { arrayFilters: [{ "elem.vendorId": payout.vendorId }] }
  );

  return payout;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
