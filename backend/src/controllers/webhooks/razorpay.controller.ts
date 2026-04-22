import { Request, Response } from "express";
import { Payment } from "../../models/Payment";
import { Order } from "../../models/Order";
import { Cart } from "../../models/Cart";
import { asyncHandler } from "../../utils/asyncHandler";
import { logger } from "../../config/logger";
import { verifyWebhookSignature } from "../../services/razorpay.service";

export const razorpayWebhook = asyncHandler(async (req: Request, res: Response) => {
  const signature = req.headers["x-razorpay-signature"] as string | undefined;
  const raw = (req as unknown as { rawBody?: string }).rawBody || JSON.stringify(req.body);

  if (!signature || !verifyWebhookSignature(raw, signature)) {
    logger.warn("Razorpay webhook: invalid signature");
    return res.status(400).json({ success: false, message: "Invalid signature" });
  }

  const event = req.body.event as string;
  const payload = req.body.payload;

  logger.info(`Razorpay webhook received: ${event}`);

  if (event === "payment.captured" || event === "payment.authorized") {
    const p = payload.payment.entity;
    const payment = await Payment.findOneAndUpdate(
      { gatewayOrderId: p.order_id },
      {
        gatewayPaymentId: p.id,
        status: event === "payment.captured" ? "captured" : "authorized",
        method: p.method,
        rawPayload: p,
        capturedAt: event === "payment.captured" ? new Date() : undefined,
      },
      { new: true }
    );
    if (payment) {
      const order = await Order.findById(payment.orderId);
      if (order && order.paymentStatus !== "paid") {
        order.paymentStatus = "paid";
        order.status = "paid";
        await order.save();
        await Cart.updateOne({ userId: order.customerId }, { items: [] });
      }
    }
  } else if (event === "payment.failed") {
    const p = payload.payment.entity;
    await Payment.findOneAndUpdate(
      { gatewayOrderId: p.order_id },
      { status: "failed", rawPayload: p }
    );
  } else if (event === "refund.processed") {
    const r = payload.refund.entity;
    // Use $inc so that multiple partial refunds on the same payment
    // accumulate correctly rather than clobbering each other. The
    // accompanying ReturnRequest-side bookkeeping in attemptRefund also
    // accumulates, so the total reported on Payment stays consistent with
    // the sum of actual gateway refunds.
    await Payment.findOneAndUpdate(
      { gatewayPaymentId: r.payment_id },
      {
        $set: {
          status: "refunded",
          refundedAt: new Date(),
        },
        $inc: { refundAmount: r.amount / 100 },
      }
    );
  }

  return res.json({ success: true });
});
