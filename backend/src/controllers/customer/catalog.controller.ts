import { Request, Response } from "express";
import { Product } from "../../models/Product";
import { Category } from "../../models/Category";
import { Review } from "../../models/Review";
import { ApiError } from "../../utils/apiError";
import { asyncHandler } from "../../utils/asyncHandler";
import { parsePagination, paginatedResponse } from "../../utils/pagination";

export const listCategories = asyncHandler(async (_req: Request, res: Response) => {
  const cats = await Category.find({ isActive: true }).sort({ sortOrder: 1, name: 1 });
  res.json({ success: true, data: cats });
});

export const listProducts = asyncHandler(async (req: Request, res: Response) => {
  const p = parsePagination(req);
  const filter: Record<string, unknown> = { isActive: true };
  if (req.query.categoryId) filter.categoryId = req.query.categoryId;
  if (req.query.vendorId) filter.vendorId = req.query.vendorId;
  if (req.query.q) filter.$text = { $search: String(req.query.q) };
  if (req.query.minPrice) filter.price = { ...(filter.price as object), $gte: Number(req.query.minPrice) };
  if (req.query.maxPrice) filter.price = { ...(filter.price as object), $lte: Number(req.query.maxPrice) };

  const sort: Record<string, 1 | -1> = {};
  const sortParam = (req.query.sort as string) || "-createdAt";
  if (sortParam.startsWith("-")) sort[sortParam.slice(1)] = -1;
  else sort[sortParam] = 1;

  const [items, total] = await Promise.all([
    Product.find(filter)
      .select("-description")
      .populate("vendorId", "businessName")
      .populate("categoryId", "name slug")
      .sort(sort)
      .skip(p.skip)
      .limit(p.limit),
    Product.countDocuments(filter),
  ]);
  res.json(paginatedResponse(items, total, p));
});

export const getProduct = asyncHandler(async (req: Request, res: Response) => {
  const slug = req.params.slug;
  const product = await Product.findOne({ slug, isActive: true })
    .populate("vendorId", "businessName")
    .populate("categoryId", "name slug");
  if (!product) throw ApiError.notFound("Product not found");

  const reviews = await Review.find({ productId: product._id })
    .populate("customerId", "name avatar")
    .sort({ createdAt: -1 })
    .limit(20);

  res.json({ success: true, data: { product, reviews } });
});
