import { Request, Response } from "express";
import { Product } from "../../models/Product";
import { Category } from "../../models/Category";
import { ApiError } from "../../utils/apiError";
import { asyncHandler } from "../../utils/asyncHandler";
import { parsePagination, paginatedResponse } from "../../utils/pagination";
import { getApprovedVendorForRequest } from "./helpers";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const vendor = await getApprovedVendorForRequest(req);
  const p = parsePagination(req);
  const filter: Record<string, unknown> = { vendorId: vendor._id };
  if (req.query.q) filter.$text = { $search: String(req.query.q) };
  if (req.query.categoryId) filter.categoryId = req.query.categoryId;
  if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === "true";

  const [items, total] = await Promise.all([
    Product.find(filter).sort({ createdAt: -1 }).skip(p.skip).limit(p.limit),
    Product.countDocuments(filter),
  ]);
  res.json(paginatedResponse(items, total, p));
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const vendor = await getApprovedVendorForRequest(req);
  const product = await Product.findOne({ _id: req.params.id, vendorId: vendor._id });
  if (!product) throw ApiError.notFound("Product not found");
  res.json({ success: true, data: product });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const vendor = await getApprovedVendorForRequest(req);

  const category = await Category.findOne({ _id: req.body.categoryId, isActive: true });
  if (!category) throw ApiError.badRequest("Invalid category");

  const slugExists = await Product.findOne({ slug: req.body.slug });
  if (slugExists) throw ApiError.conflict("Slug already exists");

  const skuExists = await Product.findOne({ sku: req.body.sku });
  if (skuExists) throw ApiError.conflict("SKU already exists");

  const product = await Product.create({ ...req.body, vendorId: vendor._id });
  res.status(201).json({ success: true, data: product });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const vendor = await getApprovedVendorForRequest(req);

  if (req.body.categoryId) {
    const category = await Category.findOne({ _id: req.body.categoryId, isActive: true });
    if (!category) throw ApiError.badRequest("Invalid category");
  }

  const product = await Product.findOneAndUpdate(
    { _id: req.params.id, vendorId: vendor._id },
    req.body,
    { new: true }
  );
  if (!product) throw ApiError.notFound("Product not found");
  res.json({ success: true, data: product });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const vendor = await getApprovedVendorForRequest(req);
  const product = await Product.findOneAndDelete({ _id: req.params.id, vendorId: vendor._id });
  if (!product) throw ApiError.notFound("Product not found");
  res.json({ success: true });
});
