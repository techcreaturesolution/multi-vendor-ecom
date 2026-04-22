import { Request, Response } from "express";
import { Payout } from "../../models/Payout";
import { ApiError } from "../../utils/apiError";
import { asyncHandler } from "../../utils/asyncHandler";
import { parsePagination, paginatedResponse } from "../../utils/pagination";
import { generateVendorPayout, markPayoutPaid } from "../../services/payout.service";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const p = parsePagination(req);
  const filter: Record<string, unknown> = {};
  if (req.query.vendorId) filter.vendorId = req.query.vendorId;
  if (req.query.status) filter.status = req.query.status;

  const [items, total] = await Promise.all([
    Payout.find(filter)
      .populate("vendorId", "businessName")
      .sort({ createdAt: -1 })
      .skip(p.skip)
      .limit(p.limit),
    Payout.countDocuments(filter),
  ]);
  res.json(paginatedResponse(items, total, p));
});

export const generate = asyncHandler(async (req: Request, res: Response) => {
  const { vendorId, periodStart, periodEnd } = req.body;
  const payout = await generateVendorPayout({
    vendorId,
    periodStart: new Date(periodStart),
    periodEnd: new Date(periodEnd),
    createdBy: req.user!.sub,
  });
  res.status(201).json({ success: true, data: payout });
});

export const markPaid = asyncHandler(async (req: Request, res: Response) => {
  const { utrNumber } = req.body;
  const payout = await markPayoutPaid(req.params.id, utrNumber);
  res.json({ success: true, data: payout });
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const payout = await Payout.findById(req.params.id).populate("vendorId", "businessName bankDetails");
  if (!payout) throw ApiError.notFound("Payout not found");
  res.json({ success: true, data: payout });
});
