import { Request, Response } from "express";
import { Address } from "../../models/Address";
import { ApiError } from "../../utils/apiError";
import { asyncHandler } from "../../utils/asyncHandler";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const addrs = await Address.find({ userId: req.user!.sub }).sort({ isDefault: -1, createdAt: -1 });
  res.json({ success: true, data: addrs });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  if (req.body.isDefault) {
    await Address.updateMany({ userId: req.user!.sub }, { isDefault: false });
  }
  const addr = await Address.create({ ...req.body, userId: req.user!.sub });
  res.status(201).json({ success: true, data: addr });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  if (req.body.isDefault) {
    await Address.updateMany({ userId: req.user!.sub }, { isDefault: false });
  }
  const addr = await Address.findOneAndUpdate(
    { _id: req.params.id, userId: req.user!.sub },
    req.body,
    { new: true }
  );
  if (!addr) throw ApiError.notFound("Address not found");
  res.json({ success: true, data: addr });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const addr = await Address.findOneAndDelete({ _id: req.params.id, userId: req.user!.sub });
  if (!addr) throw ApiError.notFound("Address not found");
  res.json({ success: true });
});
