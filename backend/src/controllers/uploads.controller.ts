import { Request, Response } from "express";
import { ApiError } from "../utils/apiError";
import { asyncHandler } from "../utils/asyncHandler";
import { publicUrlFor } from "../middleware/upload";

export const uploadSingleImage = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw ApiError.badRequest("No file uploaded");
  res.status(201).json({
    success: true,
    data: { url: publicUrlFor(req.file.filename), filename: req.file.filename },
  });
});

export const uploadMultipleImages = asyncHandler(async (req: Request, res: Response) => {
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  if (!files.length) throw ApiError.badRequest("No files uploaded");
  res.status(201).json({
    success: true,
    data: files.map((f) => ({ url: publicUrlFor(f.filename), filename: f.filename })),
  });
});
