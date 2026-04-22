import { Request, Response } from "express";
import { Shipment } from "../../models/Shipment";
import { Order } from "../../models/Order";
import { asyncHandler } from "../../utils/asyncHandler";
import { logger } from "../../config/logger";

/**
 * Shipway tracking webhook. The real payload format is documented at
 * https://shipway.com/Apidocs. We accept a minimal shape and map status
 * strings to our internal ShipmentStatus values.
 */
const STATUS_MAP: Record<string, string> = {
  INT: "in_transit",
  "in transit": "in_transit",
  OFD: "out_for_delivery",
  "out for delivery": "out_for_delivery",
  DEL: "delivered",
  delivered: "delivered",
  RTO: "returned",
  "return to origin": "returned",
  CNCL: "cancelled",
  cancelled: "cancelled",
  UD: "failed",
  "undelivered": "failed",
};

export const shipwayWebhook = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as {
    awb?: string;
    status?: string;
    status_code?: string;
    location?: string;
    message?: string;
    event_time?: string;
  };
  const awb = body.awb;
  const rawStatus = (body.status_code || body.status || "").toLowerCase();
  const mapped = STATUS_MAP[rawStatus] || STATUS_MAP[rawStatus.toUpperCase()] || rawStatus;

  if (!awb) {
    return res.status(400).json({ success: false, message: "Missing awb" });
  }

  const shipment = await Shipment.findOne({ awbNumber: awb });
  if (!shipment) {
    logger.warn(`Shipway webhook: no shipment for AWB ${awb}`);
    return res.status(404).json({ success: false, message: "Shipment not found" });
  }

  shipment.trackingEvents.push({
    status: String(mapped),
    location: body.location,
    message: body.message,
    at: body.event_time ? new Date(body.event_time) : new Date(),
  });
  shipment.status = mapped as typeof shipment.status;
  if (mapped === "delivered") shipment.deliveredAt = new Date();
  await shipment.save();

  // Reflect on order
  if (mapped === "delivered") {
    await Order.updateOne({ _id: shipment.orderId }, { status: "delivered" });
  } else if (mapped === "out_for_delivery") {
    await Order.updateOne({ _id: shipment.orderId }, { status: "out_for_delivery" });
  } else if (mapped === "in_transit") {
    await Order.updateOne(
      { _id: shipment.orderId, status: { $in: ["shipped", "paid", "processing"] } },
      { status: "shipped" }
    );
  }

  return res.json({ success: true });
});
