import { Request, Response } from "express";
import { Cart } from "../../models/Cart";
import { Product } from "../../models/Product";
import { ApiError } from "../../utils/apiError";
import { asyncHandler } from "../../utils/asyncHandler";
import { Types } from "mongoose";

async function getOrCreateCart(userId: string) {
  let cart = await Cart.findOne({ userId });
  if (!cart) cart = await Cart.create({ userId, items: [] });
  return cart;
}

export const get = asyncHandler(async (req: Request, res: Response) => {
  const cart = await getOrCreateCart(req.user!.sub);
  const populated = await cart.populate({
    path: "items.productId",
    select: "name slug price images stock sku isActive",
  });
  res.json({ success: true, data: populated });
});

export const addItem = asyncHandler(async (req: Request, res: Response) => {
  const { productId, quantity } = req.body;
  const product = await Product.findOne({ _id: productId, isActive: true });
  if (!product) throw ApiError.notFound("Product not found");
  if (product.stock < quantity) throw ApiError.badRequest("Insufficient stock");

  const cart = await getOrCreateCart(req.user!.sub);
  const idx = cart.items.findIndex((i) => String(i.productId) === String(productId));
  if (idx >= 0) {
    cart.items[idx].quantity += quantity;
    cart.items[idx].priceAtAdd = product.price;
  } else {
    cart.items.push({
      productId: new Types.ObjectId(productId),
      vendorId: product.vendorId,
      quantity,
      priceAtAdd: product.price,
    });
  }
  await cart.save();
  res.json({ success: true, data: cart });
});

export const updateItem = asyncHandler(async (req: Request, res: Response) => {
  const { productId } = req.params;
  const { quantity } = req.body;
  const cart = await getOrCreateCart(req.user!.sub);
  const idx = cart.items.findIndex((i) => String(i.productId) === productId);
  if (idx < 0) throw ApiError.notFound("Item not in cart");

  if (quantity === 0) cart.items.splice(idx, 1);
  else cart.items[idx].quantity = quantity;

  await cart.save();
  res.json({ success: true, data: cart });
});

export const removeItem = asyncHandler(async (req: Request, res: Response) => {
  const cart = await getOrCreateCart(req.user!.sub);
  cart.items = cart.items.filter((i) => String(i.productId) !== req.params.productId);
  await cart.save();
  res.json({ success: true, data: cart });
});

export const clear = asyncHandler(async (req: Request, res: Response) => {
  const cart = await getOrCreateCart(req.user!.sub);
  cart.items = [];
  await cart.save();
  res.json({ success: true });
});
