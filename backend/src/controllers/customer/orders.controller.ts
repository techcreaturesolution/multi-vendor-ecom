import { Request, Response } from "express";
import { Order } from "../../models/Order";
import { Shipment } from "../../models/Shipment";
import { ReturnRequest } from "../../models/ReturnRequest";
import { Review } from "../../models/Review";
import { ApiError } from "../../utils/apiError";
import { asyncHandler } from "../../utils/asyncHandler";
import { parsePagination, paginatedResponse } from "../../utils/pagination";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const p = parsePagination(req);
  const [items, total] = await Promise.all([
    Order.find({ customerId: req.user!.sub })
      .sort({ createdAt: -1 })
      .skip(p.skip)
      .limit(p.limit),
    Order.countDocuments({ customerId: req.user!.sub }),
  ]);
  res.json(paginatedResponse(items, total, p));
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const order = await Order.findOne({ _id: req.params.id, customerId: req.user!.sub });
  if (!order) throw ApiError.notFound("Order not found");

  const shipments = await Shipment.find({ orderId: order._id });

  res.json({ success: true, data: { order, shipments } });
});

export const track = asyncHandler(async (req: Request, res: Response) => {
  const order = await Order.findOne({ _id: req.params.id, customerId: req.user!.sub });
  if (!order) throw ApiError.notFound("Order not found");
  const shipments = await Shipment.find({ orderId: order._id });
  res.json({
    success: true,
    data: {
      orderStatus: order.status,
      shipments: shipments.map((s) => ({
        _id: s._id,
        vendorId: s.vendorId,
        awbNumber: s.awbNumber,
        courierName: s.courierName,
        status: s.status,
        events: s.trackingEvents,
      })),
    },
  });
});

export const createReview = asyncHandler(async (req: Request, res: Response) => {
  const { productId, orderId, rating, title, comment, images } = req.body;
  const order = await Order.findOne({
    _id: orderId,
    customerId: req.user!.sub,
    status: "delivered",
    "items.productId": productId,
  });
  if (!order) throw ApiError.badRequest("You can only review delivered products you ordered");

  const review = await Review.create({
    productId,
    orderId,
    customerId: req.user!.sub,
    rating,
    title,
    comment,
    images,
  });
  res.status(201).json({ success: true, data: review });
});

export const createReturn = asyncHandler(async (req: Request, res: Response) => {
  const { orderId, items } = req.body as {
    orderId: string;
    items: { productId: string; quantity: number; reason: string }[];
  };
  const order = await Order.findOne({ _id: orderId, customerId: req.user!.sub });
  if (!order) throw ApiError.notFound("Order not found");
  if (order.status !== "delivered") {
    throw ApiError.badRequest("Only delivered orders can be returned");
  }

  // Group the requested items by their vendor and create one ReturnRequest
  // per vendor so every affected vendor sees their slice.
  const byVendor = new Map<string, typeof items>();
  for (const ri of items) {
    const orderItem = order.items.find((i) => String(i.productId) === ri.productId);
    if (!orderItem) throw ApiError.badRequest(`Product ${ri.productId} not in order`);
    const vendorKey = String(orderItem.vendorId);
    const bucket = byVendor.get(vendorKey) ?? [];
    bucket.push(ri);
    byVendor.set(vendorKey, bucket);
  }

  const created = await Promise.all(
    Array.from(byVendor.entries()).map(([vendorId, vendorItems]) =>
      ReturnRequest.create({
        orderId,
        customerId: req.user!.sub,
        vendorId,
        items: vendorItems,
        status: "requested",
      })
    )
  );

  res.status(201).json({ success: true, data: created });
});
