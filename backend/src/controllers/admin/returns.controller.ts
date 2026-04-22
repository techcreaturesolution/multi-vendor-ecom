import { Request, Response } from "express";
import { ReturnRequest } from "../../models/ReturnRequest";
import { ApiError } from "../../utils/apiError";
import { asyncHandler } from "../../utils/asyncHandler";
import { parsePagination, paginatedResponse } from "../../utils/pagination";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const p = parsePagination(req);
  const filter: Record<string, unknown> = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.vendorId) filter.vendorId = req.query.vendorId;

  const [items, total] = await Promise.all([
    ReturnRequest.find(filter)
      .populate("vendorId", "businessName")
      .populate("customerId", "name email phone")
      .populate("orderId", "orderNumber grandTotal status")
      .sort({ createdAt: -1 })
      .skip(p.skip)
      .limit(p.limit),
    ReturnRequest.countDocuments(filter),
  ]);
  res.json(paginatedResponse(items, total, p));
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const rr = await ReturnRequest.findById(req.params.id)
    .populate("vendorId", "businessName")
    .populate("customerId", "name email phone")
    .populate("orderId", "orderNumber grandTotal status items")
    .populate("items.productId", "name sku price");
  if (!rr) throw ApiError.notFound("Return request not found");
  res.json({ success: true, data: rr });
});

export const setStatus = asyncHandler(async (req: Request, res: Response) => {
  const { status, vendorNote, refundAmount } = req.body as {
    status: "approved" | "rejected" | "picked_up" | "received" | "refunded";
    vendorNote?: string;
    refundAmount?: number;
  };

  const update: Record<string, unknown> = { status };
  if (vendorNote !== undefined) update.vendorNote = vendorNote;
  if (refundAmount !== undefined) update.refundAmount = refundAmount;
  if (status === "rejected" || status === "refunded") {
    update.resolvedAt = new Date();
  }

  const rr = await ReturnRequest.findByIdAndUpdate(req.params.id, update, { new: true })
    .populate("vendorId", "businessName")
    .populate("customerId", "name email phone")
    .populate("orderId", "orderNumber grandTotal status");
  if (!rr) throw ApiError.notFound("Return request not found");
  res.json({ success: true, data: rr });
});
