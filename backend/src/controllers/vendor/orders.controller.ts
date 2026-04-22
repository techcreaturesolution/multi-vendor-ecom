import { Request, Response } from "express";
import { Order } from "../../models/Order";
import { Shipment } from "../../models/Shipment";
import { Product } from "../../models/Product";
import { ApiError } from "../../utils/apiError";
import { asyncHandler } from "../../utils/asyncHandler";
import { parsePagination, paginatedResponse } from "../../utils/pagination";
import { getApprovedVendorForRequest } from "./helpers";
import { getCourierProvider } from "../../services/courier";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const vendor = await getApprovedVendorForRequest(req);
  const p = parsePagination(req);
  const filter: Record<string, unknown> = { "vendorSplits.vendorId": vendor._id };
  if (req.query.status) filter.status = req.query.status;

  const [items, total] = await Promise.all([
    Order.find(filter)
      .populate("customerId", "name email phone")
      .sort({ createdAt: -1 })
      .skip(p.skip)
      .limit(p.limit),
    Order.countDocuments(filter),
  ]);
  res.json(paginatedResponse(items, total, p));
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const vendor = await getApprovedVendorForRequest(req);
  const order = await Order.findOne({
    _id: req.params.id,
    "vendorSplits.vendorId": vendor._id,
  }).populate("customerId", "name email phone");
  if (!order) throw ApiError.notFound("Order not found");

  // Only show the caller-vendor's items and split
  const items = order.items.filter((i) => String(i.vendorId) === String(vendor._id));
  const mySplit = order.vendorSplits.find((s) => String(s.vendorId) === String(vendor._id));
  const shipment = await Shipment.findOne({ orderId: order._id, vendorId: vendor._id });

  res.json({
    success: true,
    data: {
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        customer: order.customerId,
        shippingAddress: order.shippingAddress,
        items,
        split: mySplit,
        status: order.status,
        paymentStatus: order.paymentStatus,
        placedAt: order.placedAt,
      },
      shipment,
    },
  });
});

export const ship = asyncHandler(async (req: Request, res: Response) => {
  const vendor = await getApprovedVendorForRequest(req);
  const order = await Order.findOne({
    _id: req.params.id,
    "vendorSplits.vendorId": vendor._id,
    paymentStatus: "paid",
  });
  if (!order) throw ApiError.notFound("Order not found or not paid");

  let shipment = await Shipment.findOne({ orderId: order._id, vendorId: vendor._id });

  if (!shipment || shipment.status === "pending") {
    const courier = getCourierProvider();
    const vendorItems = order.items.filter((i) => String(i.vendorId) === String(vendor._id));
    const declared = vendorItems.reduce((s, i) => s + i.subtotal, 0);

    const booking = await courier.bookShipment({
      orderNumber: order.orderNumber,
      pickup: {
        name: vendor.businessName,
        phone: "",
        line1: vendor.address.line1,
        line2: vendor.address.line2,
        city: vendor.address.city,
        state: vendor.address.state,
        pincode: vendor.address.pincode,
        country: vendor.address.country,
      },
      drop: {
        name: order.shippingAddress.fullName,
        phone: order.shippingAddress.phone,
        line1: order.shippingAddress.line1,
        line2: order.shippingAddress.line2,
        city: order.shippingAddress.city,
        state: order.shippingAddress.state,
        pincode: order.shippingAddress.pincode,
        country: order.shippingAddress.country,
      },
      parcel: { weightGrams: 500, declaredValue: declared },
      courierCode: req.body.courierCode,
    });

    if (!shipment) {
      shipment = await Shipment.create({
        orderId: order._id,
        vendorId: vendor._id,
        provider: "shipway",
        weightGrams: 500,
        chargedAmount: booking.chargedAmount,
        awbNumber: booking.awbNumber,
        courierName: booking.courierName,
        labelUrl: booking.labelUrl,
        status: "booked",
        bookedAt: new Date(),
        trackingEvents: [
          { status: "booked", message: `AWB ${booking.awbNumber}`, at: new Date() },
        ],
      });
    } else {
      shipment.awbNumber = booking.awbNumber;
      shipment.courierName = booking.courierName;
      shipment.labelUrl = booking.labelUrl;
      shipment.chargedAmount = booking.chargedAmount;
      shipment.status = "booked";
      shipment.bookedAt = new Date();
      shipment.trackingEvents.push({
        status: "booked",
        message: `AWB ${booking.awbNumber}`,
        at: new Date(),
      });
      await shipment.save();
    }
  }

  order.status = "shipped";
  await order.save();

  // Decrement stock
  for (const item of order.items.filter((i) => String(i.vendorId) === String(vendor._id))) {
    await Product.updateOne({ _id: item.productId }, { $inc: { stock: -item.quantity } });
  }

  res.json({ success: true, data: { order, shipment } });
});

export const setStatus = asyncHandler(async (req: Request, res: Response) => {
  const vendor = await getApprovedVendorForRequest(req);
  const { status, note } = req.body;
  const order = await Order.findOne({
    _id: req.params.id,
    "vendorSplits.vendorId": vendor._id,
  });
  if (!order) throw ApiError.notFound("Order not found");

  order.status = status;
  if (status === "cancelled") {
    order.cancelledAt = new Date();
    order.cancellationReason = note;
  }
  await order.save();

  await Shipment.updateOne(
    { orderId: order._id, vendorId: vendor._id },
    { $push: { trackingEvents: { status, message: note, at: new Date() } } }
  );

  res.json({ success: true, data: order });
});
