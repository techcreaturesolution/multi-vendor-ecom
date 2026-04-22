import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { getVendorForRequest } from "./helpers";

export const me = asyncHandler(async (req: Request, res: Response) => {
  const vendor = await getVendorForRequest(req);
  res.json({ success: true, data: vendor });
});

export const uploadKyc = asyncHandler(async (req: Request, res: Response) => {
  const vendor = await getVendorForRequest(req);
  const { docType, fileUrl } = req.body;
  vendor.kycDocuments.push({
    docType,
    fileUrl,
    uploadedAt: new Date(),
    status: "pending",
  });
  await vendor.save();
  res.status(201).json({ success: true, data: vendor });
});
