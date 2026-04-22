import { Request, Response } from "express";
import { Cart } from "../../models/Cart";
import { Address } from "../../models/Address";
import { Order } from "../../models/Order";
import { Payment } from "../../models/Payment";
import { Vendor } from "../../models/Vendor";
import { ApiError } from "../../utils/apiError";
import { asyncHandler } from "../../utils/asyncHandler";
import { env } from "../../config/env";
import { buildOrder } from "../../services/order.service";
import { getCourierProvider } from "../../services/courier";
import {
  createRazorpayOrder,
  verifyRazorpaySignature,
} from "../../services/razorpay.service";

/**
 * Quote shipping rates per vendor group in the cart toward the given pincode.
 * Returned map: vendorId -> { courierName, chargeInr, estimatedDays }.
 */
export const quoteShipping = asyncHandler(async (req: Request, res: Response) => {
  const { pincode } = req.body;
  const cart = await Cart.findOne({ userId: req.user!.sub });
  if (!cart || !cart.items.length) throw ApiError.badRequest("Cart is empty");

  const vendorIds = Array.from(new Set(cart.items.map((i) => String(i.vendorId))));
  const vendors = await Vendor.find({ _id: { $in: vendorIds } });
  const vendorMap = new Map(vendors.map((v) => [String(v._id), v]));

  const courier = getCourierProvider();
  const result: Record<
    string,
    { vendorName: string; serviceable: boolean; courierName?: string; chargeInr: number; estimatedDays?: number }
  > = {};

  for (const vId of vendorIds) {
    const v = vendorMap.get(vId);
    if (!v) continue;
    const serviceable = await courier.checkServiceability(v.address.pincode, pincode);
    if (!serviceable) {
      result[vId] = { vendorName: v.businessName, serviceable: false, chargeInr: 0 };
      continue;
    }
    const weightGrams = cart.items
      .filter((i) => String(i.vendorId) === vId)
      .reduce((s, i) => s + 500 * i.quantity, 0);
    const rates = await courier.getRates({
      fromPincode: v.address.pincode,
      toPincode: pincode,
      parcel: { weightGrams, declaredValue: 0 },
    });
    const cheapest = rates.sort((a, b) => a.chargeInr - b.chargeInr)[0];
    result[vId] = {
      vendorName: v.businessName,
      serviceable: true,
      courierName: cheapest?.courierName,
      chargeInr: cheapest?.chargeInr || 0,
      estimatedDays: cheapest?.estimatedDeliveryDays,
    };
  }

  res.json({ success: true, data: result });
});

/**
 * Create an Order in pending_payment state and a corresponding Razorpay order
 * so the client can open checkout.
 */
export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  const { addressId } = req.body;
  const address = await Address.findOne({ _id: addressId, userId: req.user!.sub });
  if (!address) throw ApiError.notFound("Address not found");

  const cart = await Cart.findOne({ userId: req.user!.sub });
  if (!cart || !cart.items.length) throw ApiError.badRequest("Cart is empty");

  // Per-vendor shipping costs
  const vendorIds = Array.from(new Set(cart.items.map((i) => String(i.vendorId))));
  const vendors = await Vendor.find({ _id: { $in: vendorIds } });
  const courier = getCourierProvider();
  const vendorShippingCosts: Record<string, number> = {};
  for (const v of vendors) {
    const weightGrams = cart.items
      .filter((i) => String(i.vendorId) === String(v._id))
      .reduce((s, i) => s + 500 * i.quantity, 0);
    const rates = await courier.getRates({
      fromPincode: v.address.pincode,
      toPincode: address.pincode,
      parcel: { weightGrams, declaredValue: 0 },
    });
    vendorShippingCosts[String(v._id)] = rates.sort((a, b) => a.chargeInr - b.chargeInr)[0]?.chargeInr || 0;
  }

  const order = await buildOrder({
    customerId: req.user!.sub,
    items: cart.items.map((i) => ({
      productId: String(i.productId),
      quantity: i.quantity,
      variantSku: i.variantSku,
    })),
    shippingAddress: {
      fullName: address.fullName,
      phone: address.phone,
      line1: address.line1,
      line2: address.line2,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      country: address.country,
    },
    vendorShippingCosts,
  });
  await order.save();

  if (!env.razorpay.keyId || !env.razorpay.keySecret) {
    throw ApiError.internal("Razorpay is not configured");
  }

  const rzpOrder = await createRazorpayOrder({
    amount: Math.round(order.grandTotal * 100),
    currency: "INR",
    receipt: order.orderNumber,
    notes: { orderId: String(order._id), customerId: req.user!.sub },
  });

  const payment = await Payment.create({
    orderId: order._id,
    customerId: req.user!.sub,
    gateway: "razorpay",
    gatewayOrderId: rzpOrder.id,
    amount: order.grandTotal,
    status: "created",
  });

  order.paymentId = payment._id as import("mongoose").Types.ObjectId;
  await order.save();

  res.status(201).json({
    success: true,
    data: {
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        grandTotal: order.grandTotal,
      },
      razorpay: {
        keyId: env.razorpay.keyId,
        orderId: rzpOrder.id,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
      },
    },
  });
});

/**
 * Verify Razorpay payment signature from the client and mark the order paid.
 * Webhook handler does the same thing server-to-server as a belt-and-suspenders.
 */
export const verifyPayment = asyncHandler(async (req: Request, res: Response) => {
  const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

  const order = await Order.findOne({ _id: orderId, customerId: req.user!.sub });
  if (!order) throw ApiError.notFound("Order not found");

  const valid = verifyRazorpaySignature({
    orderId: razorpayOrderId,
    paymentId: razorpayPaymentId,
    signature: razorpaySignature,
  });
  if (!valid) throw ApiError.badRequest("Invalid payment signature");

  await Payment.updateOne(
    { gatewayOrderId: razorpayOrderId },
    {
      gatewayPaymentId: razorpayPaymentId,
      gatewaySignature: razorpaySignature,
      status: "captured",
      capturedAt: new Date(),
    }
  );

  order.paymentStatus = "paid";
  order.status = "paid";
  await order.save();

  // Clear cart
  await Cart.updateOne({ userId: req.user!.sub }, { items: [] });

  res.json({ success: true, data: order });
});
