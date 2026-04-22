import { Request, Response } from "express";
import { Vendor } from "../../models/Vendor";
import { User } from "../../models/User";
import { Product } from "../../models/Product";
import { Order } from "../../models/Order";
import { ApiError } from "../../utils/apiError";
import { asyncHandler } from "../../utils/asyncHandler";
import { parsePagination, paginatedResponse } from "../../utils/pagination";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const p = parsePagination(req);
  const filter: Record<string, unknown> = {};
  if (req.query.status) filter.status = req.query.status;

  const [items, total] = await Promise.all([
    Vendor.find(filter)
      .populate("userId", "name email phone isActive")
      .sort({ createdAt: -1 })
      .skip(p.skip)
      .limit(p.limit),
    Vendor.countDocuments(filter),
  ]);
  res.json(paginatedResponse(items, total, p));
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const vendor = await Vendor.findById(req.params.id).populate("userId", "-password");
  if (!vendor) throw ApiError.notFound("Vendor not found");

  const [productCount, orderCount, delivered] = await Promise.all([
    Product.countDocuments({ vendorId: vendor._id }),
    Order.countDocuments({ "vendorSplits.vendorId": vendor._id }),
    Order.countDocuments({ "vendorSplits.vendorId": vendor._id, status: "delivered" }),
  ]);

  res.json({
    success: true,
    data: { vendor, stats: { productCount, orderCount, delivered } },
  });
});

export const approve = asyncHandler(async (req: Request, res: Response) => {
  const { approved, rejectionReason } = req.body;
  const vendor = await Vendor.findById(req.params.id);
  if (!vendor) throw ApiError.notFound("Vendor not found");

  if (approved) {
    vendor.status = "approved";
    vendor.approvedAt = new Date();
    vendor.approvedBy = req.user ? (req.user.sub as unknown as typeof vendor.approvedBy) : undefined;
    vendor.rejectionReason = undefined;
  } else {
    vendor.status = "rejected";
    vendor.rejectionReason = rejectionReason || "Not specified";
  }
  await vendor.save();
  res.json({ success: true, data: vendor });
});

export const setStatus = asyncHandler(async (req: Request, res: Response) => {
  const { isActive } = req.body;
  const vendor = await Vendor.findById(req.params.id);
  if (!vendor) throw ApiError.notFound("Vendor not found");

  vendor.status = isActive ? "approved" : "suspended";
  await vendor.save();
  await User.findByIdAndUpdate(vendor.userId, { isActive });
  res.json({ success: true, data: vendor });
});
