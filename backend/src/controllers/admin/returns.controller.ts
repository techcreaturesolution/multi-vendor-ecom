import { Request, Response } from "express";
import { ReturnRequest } from "../../models/ReturnRequest";
import { Payment } from "../../models/Payment";
import { Order } from "../../models/Order";
import { ApiError } from "../../utils/apiError";
import { asyncHandler } from "../../utils/asyncHandler";
import { parsePagination, paginatedResponse } from "../../utils/pagination";
import { env } from "../../config/env";
import { refundRazorpayPayment } from "../../services/razorpay.service";
import { logger } from "../../config/logger";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const p = parsePagination(req);
  const filter: Record<string, unknown> = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.vendorId) filter.vendorId = req.query.vendorId;

  const [items, total] = await Promise.all([
    ReturnRequest.find(filter)
      .populate("vendorId", "businessName")
      .populate("customerId", "name email phone")
      .populate("orderId", "orderNumber grandTotal status")
      .sort({ createdAt: -1 })
      .skip(p.skip)
      .limit(p.limit),
    ReturnRequest.countDocuments(filter),
  ]);
  res.json(paginatedResponse(items, total, p));
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const rr = await ReturnRequest.findById(req.params.id)
    .populate("vendorId", "businessName")
    .populate("customerId", "name email phone")
    .populate("orderId", "orderNumber grandTotal status items")
    .populate("items.productId", "name sku price");
  if (!rr) throw ApiError.notFound("Return request not found");
  res.json({ success: true, data: rr });
});

/**
 * Admin transitions a return request. When the target is `refunded` we also
 * attempt a Razorpay refund against the captured payment. We never block the
 * status transition on a gateway error — we record the error and expose it so
 * the admin can retry via POST /:id/refund.
 */
export const setStatus = asyncHandler(async (req: Request, res: Response) => {
  const { status, vendorNote, refundAmount } = req.body as {
    status: "approved" | "rejected" | "picked_up" | "received" | "refunded";
    vendorNote?: string;
    refundAmount?: number;
  };

  const rr = await ReturnRequest.findById(req.params.id);
  if (!rr) throw ApiError.notFound("Return request not found");

  rr.status = status;
  if (vendorNote !== undefined) rr.vendorNote = vendorNote;
  if (refundAmount !== undefined) rr.refundAmount = refundAmount;
  if (status === "rejected" || status === "refunded") {
    rr.resolvedAt = new Date();
  }

  if (status === "refunded" && !rr.gatewayRefundId) {
    await attemptRefund(rr);
  }

  await rr.save();

  const populated = await ReturnRequest.findById(rr._id)
    .populate("vendorId", "businessName")
    .populate("customerId", "name email phone")
    .populate("orderId", "orderNumber grandTotal status");
  res.json({ success: true, data: populated });
});

/**
 * Retry the Razorpay refund for a return request that's already in `refunded`
 * state but for which the gateway call previously failed (or was never made
 * because Razorpay was not configured at the time).
 */
export const retryRefund = asyncHandler(async (req: Request, res: Response) => {
  const rr = await ReturnRequest.findById(req.params.id);
  if (!rr) throw ApiError.notFound("Return request not found");
  if (rr.status !== "refunded") {
    throw ApiError.badRequest("Return must be in refunded state before refunding");
  }
  // The gateway call itself is the source of truth for idempotency. Even if
  // a bookkeeping save failed after a successful refund (leaving us with
  // gatewayRefundId set but refundStatus !== "processed"), we must not issue
  // a second refund to Razorpay. Block on gatewayRefundId alone.
  if (rr.gatewayRefundId) {
    throw ApiError.badRequest(
      `Refund already issued at the gateway (${rr.gatewayRefundId})`
    );
  }
  await attemptRefund(rr);
  await rr.save();
  res.json({ success: true, data: rr });
});

async function attemptRefund(rr: InstanceType<typeof ReturnRequest>): Promise<void> {
  if (!env.razorpay.keyId || !env.razorpay.keySecret) {
    rr.refundStatus = "pending";
    rr.refundError = "Razorpay is not configured on this server";
    return;
  }

  const order = await Order.findById(rr.orderId);
  const payment = order?.paymentId ? await Payment.findById(order.paymentId) : null;
  if (!payment || !payment.gatewayPaymentId) {
    rr.refundStatus = "failed";
    rr.refundError = "No captured payment found for this order";
    return;
  }

  try {
    const refund = await refundRazorpayPayment({
      paymentId: payment.gatewayPaymentId,
      amount: rr.refundAmount,
      notes: {
        returnRequestId: String(rr._id),
        orderId: String(rr.orderId),
      },
    });
    rr.gatewayRefundId = refund.id;
    rr.refundStatus = "processed";
    rr.refundError = undefined;

    payment.status = "refunded";
    payment.refundedAt = new Date();
    payment.refundAmount =
      (payment.refundAmount || 0) + (rr.refundAmount ?? payment.amount);
    await payment.save();

    if (order) {
      order.paymentStatus = "refunded";
      order.status = "refunded";
      await order.save();
    }
  } catch (err) {
    logger.error(`Razorpay refund failed: ${err instanceof Error ? err.message : String(err)}`);
    rr.refundStatus = "failed";
    rr.refundError = err instanceof Error ? err.message : String(err);
  }
}
