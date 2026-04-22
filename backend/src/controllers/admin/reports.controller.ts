import { Request, Response } from "express";
import { Order } from "../../models/Order";
import { User } from "../../models/User";
import { Vendor } from "../../models/Vendor";
import { Product } from "../../models/Product";
import { asyncHandler } from "../../utils/asyncHandler";

export const dashboard = asyncHandler(async (_req: Request, res: Response) => {
  const [
    totalCustomers,
    totalVendors,
    approvedVendors,
    totalProducts,
    totalOrders,
    paidOrders,
    revenueAgg,
    commissionAgg,
  ] = await Promise.all([
    User.countDocuments({ role: "customer" }),
    Vendor.countDocuments(),
    Vendor.countDocuments({ status: "approved" }),
    Product.countDocuments(),
    Order.countDocuments(),
    Order.countDocuments({ paymentStatus: "paid" }),
    Order.aggregate([
      { $match: { paymentStatus: "paid" } },
      { $group: { _id: null, gross: { $sum: "$grandTotal" } } },
    ]),
    Order.aggregate([
      { $match: { paymentStatus: "paid" } },
      { $unwind: "$vendorSplits" },
      {
        $group: {
          _id: null,
          totalCommission: { $sum: "$vendorSplits.adminCommissionAmount" },
          totalShipping: { $sum: "$vendorSplits.shippingCost" },
          totalVendorNet: { $sum: "$vendorSplits.vendorNetAmount" },
        },
      },
    ]),
  ]);

  res.json({
    success: true,
    data: {
      totalCustomers,
      totalVendors,
      approvedVendors,
      totalProducts,
      totalOrders,
      paidOrders,
      grossRevenue: revenueAgg[0]?.gross || 0,
      adminCommissionEarned: commissionAgg[0]?.totalCommission || 0,
      totalShippingCollected: commissionAgg[0]?.totalShipping || 0,
      totalVendorPayable: commissionAgg[0]?.totalVendorNet || 0,
    },
  });
});
