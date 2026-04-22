import { Request, Response } from "express";
import { Cart, ICartItem } from "../../models/Cart";
import { Product, IProductVariant } from "../../models/Product";
import { ApiError } from "../../utils/apiError";
import { asyncHandler } from "../../utils/asyncHandler";
import { Types } from "mongoose";

async function getOrCreateCart(userId: string) {
  let cart = await Cart.findOne({ userId });
  if (!cart) cart = await Cart.create({ userId, items: [] });
  return cart;
}

function findVariant(
  variants: IProductVariant[] | undefined,
  sku: string | undefined
): IProductVariant | null {
  if (!sku) return null;
  return variants?.find((v) => v.sku === sku) || null;
}

function sameLine(item: ICartItem, productId: string, variantSku?: string): boolean {
  return (
    String(item.productId) === productId &&
    (item.variantSku || undefined) === (variantSku || undefined)
  );
}

export const get = asyncHandler(async (req: Request, res: Response) => {
  const cart = await getOrCreateCart(req.user!.sub);
  const populated = await cart.populate({
    path: "items.productId",
    select: "name slug price images stock sku isActive variants",
  });
  res.json({ success: true, data: populated });
});

export const addItem = asyncHandler(async (req: Request, res: Response) => {
  const { productId, quantity, variantSku } = req.body as {
    productId: string;
    quantity: number;
    variantSku?: string;
  };
  const product = await Product.findOne({ _id: productId, isActive: true });
  if (!product) throw ApiError.notFound("Product not found");

  // If the product has variants defined, require a variantSku selection so
  // the cart line carries the exact SKU, price, and stock the customer saw.
  let price = product.price;
  let availableStock = product.stock;
  if (variantSku) {
    const variant = findVariant(product.variants, variantSku);
    if (!variant) throw ApiError.badRequest("Variant not found on this product");
    price = variant.price;
    availableStock = variant.stock;
  } else if (product.variants && product.variants.length > 0) {
    throw ApiError.badRequest("Please select a variant");
  }

  if (availableStock < quantity) throw ApiError.badRequest("Insufficient stock");

  const cart = await getOrCreateCart(req.user!.sub);
  const idx = cart.items.findIndex((i) => sameLine(i, productId, variantSku));
  if (idx >= 0) {
    const newQty = cart.items[idx].quantity + quantity;
    if (availableStock < newQty) throw ApiError.badRequest("Insufficient stock");
    cart.items[idx].quantity = newQty;
    cart.items[idx].priceAtAdd = price;
  } else {
    cart.items.push({
      productId: new Types.ObjectId(productId),
      vendorId: product.vendorId,
      variantSku,
      quantity,
      priceAtAdd: price,
    });
  }
  await cart.save();
  res.json({ success: true, data: cart });
});

export const updateItem = asyncHandler(async (req: Request, res: Response) => {
  const { productId } = req.params;
  const { quantity, variantSku } = req.body as {
    quantity: number;
    variantSku?: string;
  };
  const cart = await getOrCreateCart(req.user!.sub);
  const idx = cart.items.findIndex((i) => sameLine(i, productId, variantSku));
  if (idx < 0) throw ApiError.notFound("Item not in cart");

  if (quantity === 0) {
    cart.items.splice(idx, 1);
  } else {
    // Re-check stock against the current product/variant.
    const product = await Product.findOne({ _id: productId, isActive: true });
    if (!product) throw ApiError.notFound("Product not found");
    const available = variantSku
      ? findVariant(product.variants, variantSku)?.stock ?? 0
      : product.stock;
    if (available < quantity) throw ApiError.badRequest("Insufficient stock");
    cart.items[idx].quantity = quantity;
  }

  await cart.save();
  res.json({ success: true, data: cart });
});

export const removeItem = asyncHandler(async (req: Request, res: Response) => {
  const cart = await getOrCreateCart(req.user!.sub);
  // Allow variantSku to be passed either via query (?variantSku=...) or body
  // so callers that already use the RESTful DELETE verb aren't forced to send
  // a body.
  const variantSku =
    (req.query.variantSku as string | undefined) ||
    (req.body?.variantSku as string | undefined);
  cart.items = cart.items.filter(
    (i) => !sameLine(i, req.params.productId, variantSku)
  );
  await cart.save();
  res.json({ success: true });
});

export const clear = asyncHandler(async (req: Request, res: Response) => {
  const cart = await getOrCreateCart(req.user!.sub);
  cart.items = [];
  await cart.save();
  res.json({ success: true });
});
