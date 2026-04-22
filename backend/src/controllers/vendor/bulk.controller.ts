import { Request, Response } from "express";
import { Product } from "../../models/Product";
import { Category } from "../../models/Category";
import { ApiError } from "../../utils/apiError";
import { asyncHandler } from "../../utils/asyncHandler";
import { getApprovedVendorForRequest } from "./helpers";
import { parseCsvAsObjects } from "../../utils/csv";

type RowResult =
  | { row: number; action: "created" | "updated"; sku: string; productId: string }
  | { row: number; action: "error"; sku?: string; error: string };

/**
 * Bulk create/update products via CSV. Expected headers:
 *   name, slug, sku, categorySlug, price, stock, description
 * Optional headers:
 *   shortDescription, compareAtPrice, lowStockThreshold, weight, tags,
 *   images, isActive, variantsJson
 *
 *   - `tags` and `images` are pipe-separated (`|`) lists
 *   - `images` values must be absolute URLs or `/uploads/...` paths
 *   - `variantsJson` is a JSON array: [{sku,attributes,price,stock,image?},...]
 *   - `isActive` accepts true/false/1/0/yes/no
 *
 * Upsert semantics: rows matching an existing product by slug (same vendor)
 * are updated; otherwise a new product is created. The entire batch is not
 * transactional — each row is reported independently so the vendor can fix
 * errors and re-upload the remaining rows.
 */
export const bulkUpload = asyncHandler(async (req: Request, res: Response) => {
  const vendor = await getApprovedVendorForRequest(req);
  const file = (req as Request & { file?: Express.Multer.File }).file;
  if (!file) throw ApiError.badRequest("CSV file is required");

  const csv = file.buffer.toString("utf8");
  const { headers, rows } = parseCsvAsObjects(csv);
  const required = ["name", "slug", "sku", "categorySlug", "price", "stock", "description"];
  const missing = required.filter((h) => !headers.includes(h));
  if (missing.length) {
    throw ApiError.badRequest(`Missing required columns: ${missing.join(", ")}`);
  }

  // Pre-load categories by slug for fewer DB hits
  const categorySlugs = Array.from(
    new Set(rows.map((r) => r.categorySlug).filter(Boolean))
  );
  const categories = await Category.find({ slug: { $in: categorySlugs } });
  const categoryBySlug = new Map(categories.map((c) => [c.slug, c]));

  const results: RowResult[] = [];
  let created = 0;
  let updated = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const line = i + 2; // +1 for header, +1 for 1-indexed
    try {
      if (!row.name || !row.slug || !row.sku || !row.categorySlug) {
        throw new Error("name, slug, sku, and categorySlug are required");
      }
      const category = categoryBySlug.get(row.categorySlug);
      if (!category) throw new Error(`Unknown categorySlug: ${row.categorySlug}`);

      const price = toNumber(row.price, "price");
      const stock = toNumber(row.stock, "stock", true);

      const doc: Record<string, unknown> = {
        vendorId: vendor._id,
        categoryId: category._id,
        name: row.name,
        slug: row.slug.toLowerCase(),
        sku: row.sku,
        description: row.description || row.name,
        price,
        stock,
      };
      if (row.shortDescription) doc.shortDescription = row.shortDescription;
      if (row.compareAtPrice) doc.compareAtPrice = toNumber(row.compareAtPrice, "compareAtPrice");
      if (row.lowStockThreshold)
        doc.lowStockThreshold = toNumber(row.lowStockThreshold, "lowStockThreshold", true);
      if (row.weight) doc.weight = toNumber(row.weight, "weight");
      if (row.tags) doc.tags = splitList(row.tags);
      if (row.images) {
        const imgs = splitList(row.images);
        for (const img of imgs) {
          if (!/^https?:\/\//.test(img) && !img.startsWith("/uploads/")) {
            throw new Error(`Invalid image URL: ${img}`);
          }
        }
        doc.images = imgs;
      }
      if (row.isActive) doc.isActive = toBool(row.isActive);
      if (row.variantsJson) doc.variants = parseVariants(row.variantsJson);

      const existing = await Product.findOne({ slug: doc.slug, vendorId: vendor._id });
      if (existing) {
        // Guard against sku collision with a different product
        const skuCollision = await Product.findOne({
          sku: doc.sku,
          _id: { $ne: existing._id },
        });
        if (skuCollision) throw new Error(`SKU already in use: ${doc.sku}`);
        Object.assign(existing, doc);
        await existing.save();
        updated++;
        results.push({
          row: line,
          action: "updated",
          sku: String(doc.sku),
          productId: String(existing._id),
        });
      } else {
        const slugCollision = await Product.findOne({ slug: doc.slug });
        if (slugCollision) throw new Error(`Slug already in use: ${doc.slug}`);
        const skuCollision = await Product.findOne({ sku: doc.sku });
        if (skuCollision) throw new Error(`SKU already in use: ${doc.sku}`);
        const product = await Product.create(doc);
        created++;
        results.push({
          row: line,
          action: "created",
          sku: String(doc.sku),
          productId: String(product._id),
        });
      }
    } catch (err) {
      results.push({
        row: line,
        action: "error",
        sku: row.sku || undefined,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  res.json({
    success: true,
    data: {
      totalRows: rows.length,
      created,
      updated,
      errors: results.filter((r) => r.action === "error").length,
      results,
    },
  });
});

function splitList(raw: string): string[] {
  return raw
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);
}

function toNumber(raw: string, field: string, integer = false): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) throw new Error(`Invalid ${field}: ${raw}`);
  if (integer && !Number.isInteger(n)) throw new Error(`${field} must be an integer`);
  return n;
}

function toBool(raw: string): boolean {
  return /^(true|1|yes|y)$/i.test(raw.trim());
}

function parseVariants(raw: string): unknown {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error();
    for (const v of parsed) {
      if (!v || typeof v !== "object") throw new Error();
      if (typeof v.sku !== "string" || typeof v.price !== "number" || typeof v.stock !== "number") {
        throw new Error();
      }
    }
    return parsed;
  } catch {
    throw new Error("variantsJson must be a JSON array of {sku,attributes,price,stock,image?}");
  }
}
