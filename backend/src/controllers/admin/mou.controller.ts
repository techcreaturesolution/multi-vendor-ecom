import { Request, Response } from "express";
import { MOU } from "../../models/MOU";
import { Vendor } from "../../models/Vendor";
import { ApiError } from "../../utils/apiError";
import { asyncHandler } from "../../utils/asyncHandler";
import { parsePagination, paginatedResponse } from "../../utils/pagination";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const p = parsePagination(req);
  const filter: Record<string, unknown> = {};
  if (req.query.vendorId) filter.vendorId = req.query.vendorId;
  if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === "true";

  const [items, total] = await Promise.all([
    MOU.find(filter)
      .populate("vendorId", "businessName status")
      .sort({ createdAt: -1 })
      .skip(p.skip)
      .limit(p.limit),
    MOU.countDocuments(filter),
  ]);
  res.json(paginatedResponse(items, total, p));
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const { vendorId, adminCommissionPercent, effectiveFrom, effectiveTo, terms, documentUrl } =
    req.body;

  const vendor = await Vendor.findById(vendorId);
  if (!vendor) throw ApiError.notFound("Vendor not found");

  // Deactivate any existing active MOU for this vendor
  await MOU.updateMany({ vendorId, isActive: true }, { $set: { isActive: false } });

  const mou = await MOU.create({
    vendorId,
    adminCommissionPercent,
    effectiveFrom,
    effectiveTo,
    terms,
    documentUrl,
    isActive: true,
    signedByAdminAt: new Date(),
    createdBy: req.user!.sub,
  });

  res.status(201).json({ success: true, data: mou });
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const mou = await MOU.findById(req.params.id).populate("vendorId", "businessName");
  if (!mou) throw ApiError.notFound("MOU not found");
  res.json({ success: true, data: mou });
});

export const deactivate = asyncHandler(async (req: Request, res: Response) => {
  const mou = await MOU.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!mou) throw ApiError.notFound("MOU not found");
  res.json({ success: true, data: mou });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const { adminCommissionPercent, effectiveFrom, effectiveTo, terms, documentUrl } = req.body as {
    adminCommissionPercent?: number;
    effectiveFrom?: string;
    effectiveTo?: string;
    terms?: string;
    documentUrl?: string;
  };

  const update: Record<string, unknown> = {};
  if (adminCommissionPercent !== undefined) update.adminCommissionPercent = adminCommissionPercent;
  if (effectiveFrom !== undefined) update.effectiveFrom = new Date(effectiveFrom);
  if (effectiveTo !== undefined) update.effectiveTo = effectiveTo ? new Date(effectiveTo) : null;
  if (terms !== undefined) update.terms = terms;
  if (documentUrl !== undefined) update.documentUrl = documentUrl;

  const mou = await MOU.findByIdAndUpdate(req.params.id, update, { new: true }).populate(
    "vendorId",
    "businessName"
  );
  if (!mou) throw ApiError.notFound("MOU not found");
  res.json({ success: true, data: mou });
});
