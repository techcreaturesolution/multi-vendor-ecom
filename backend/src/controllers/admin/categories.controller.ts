import { Request, Response } from "express";
import { Category } from "../../models/Category";
import { Product } from "../../models/Product";
import { ApiError } from "../../utils/apiError";
import { asyncHandler } from "../../utils/asyncHandler";
import { parsePagination, paginatedResponse } from "../../utils/pagination";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const p = parsePagination(req);
  const filter: Record<string, unknown> = {};
  if (req.query.parentId) filter.parentId = req.query.parentId;
  if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === "true";

  const [items, total] = await Promise.all([
    Category.find(filter).sort({ sortOrder: 1, name: 1 }).skip(p.skip).limit(p.limit),
    Category.countDocuments(filter),
  ]);
  res.json(paginatedResponse(items, total, p));
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const cat = await Category.findById(req.params.id);
  if (!cat) throw ApiError.notFound("Category not found");
  res.json({ success: true, data: cat });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const existing = await Category.findOne({ slug: req.body.slug });
  if (existing) throw ApiError.conflict("Slug already exists");
  const cat = await Category.create(req.body);
  res.status(201).json({ success: true, data: cat });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const cat = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!cat) throw ApiError.notFound("Category not found");
  res.json({ success: true, data: cat });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const inUse = await Product.countDocuments({ categoryId: req.params.id });
  if (inUse > 0) {
    throw ApiError.conflict(`Cannot delete: ${inUse} product(s) still use this category`);
  }
  const child = await Category.countDocuments({ parentId: req.params.id });
  if (child > 0) {
    throw ApiError.conflict(`Cannot delete: ${child} child category(ies) exist`);
  }
  const cat = await Category.findByIdAndDelete(req.params.id);
  if (!cat) throw ApiError.notFound("Category not found");
  res.json({ success: true });
});
