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
 * Atomically claim a ReturnRequest for a Razorpay refund attempt. Returns
 * the claimed doc, or null if another request already has the claim (or
 * the gateway refund has already been issued). Using findOneAndUpdate
 * guarantees that two concurrent callers cannot both proceed to the
 * external Razorpay API for the same return.
 */
async function claimForRefund(
  id: string,
  extraSet: Record<string, unknown> = {}
) {
  return ReturnRequest.findOneAndUpdate(
    {
      _id: id,
      gatewayRefundId: { $in: [null, undefined, ""] },
      refundStatus: { $ne: "processing" },
    },
    {
      $set: { refundStatus: "processing", ...extraSet },
      // `$set: { refundError: undefined }` is silently dropped by the
      // MongoDB driver's `ignoreUndefined` default — use $unset instead
      // so any prior error actually clears as the new attempt begins.
      $unset: { refundError: 1 },
    },
    { new: true }
  );
}

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

  if (status === "refunded") {
    // Atomic claim so two concurrent "mark refunded" requests cannot both
    // reach the Razorpay API. The claim also lays down status=refunded,
    // vendorNote, refundAmount, and resolvedAt in the same write so callers
    // see consistent state.
    const set: Record<string, unknown> = {
      status: "refunded",
      resolvedAt: new Date(),
    };
    if (vendorNote !== undefined) set.vendorNote = vendorNote;
    if (refundAmount !== undefined) set.refundAmount = refundAmount;

    const rr = await claimForRefund(req.params.id, set);
    if (!rr) {
      const existing = await ReturnRequest.findById(req.params.id);
      if (!existing) throw ApiError.notFound("Return request not found");
      if (existing.gatewayRefundId) {
        // Already refunded at the gateway — idempotently apply the non-
        // refund fields (note / recorded amount) without re-issuing.
        if (vendorNote !== undefined) existing.vendorNote = vendorNote;
        if (refundAmount !== undefined) existing.refundAmount = refundAmount;
        existing.status = "refunded";
        existing.resolvedAt = existing.resolvedAt || new Date();
        await existing.save();
        const populated = await ReturnRequest.findById(existing._id)
          .populate("vendorId", "businessName")
          .populate("customerId", "name email phone")
          .populate("orderId", "orderNumber grandTotal status");
        res.json({ success: true, data: populated });
        return;
      }
      throw ApiError.badRequest("A refund attempt is already in progress");
    }

    await attemptRefund(rr);
    await rr.save();

    const populated = await ReturnRequest.findById(rr._id)
      .populate("vendorId", "businessName")
      .populate("customerId", "name email phone")
      .populate("orderId", "orderNumber grandTotal status");
    res.json({ success: true, data: populated });
    return;
  }

  // Non-refund transitions do not call any external API, so a simple
  // read-modify-write is fine.
  const rr = await ReturnRequest.findById(req.params.id);
  if (!rr) throw ApiError.notFound("Return request not found");
  rr.status = status;
  if (vendorNote !== undefined) rr.vendorNote = vendorNote;
  if (refundAmount !== undefined) rr.refundAmount = refundAmount;
  if (status === "rejected") rr.resolvedAt = new Date();
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
 *
 * Shares the same atomic claim with setStatus so a double-click or a
 * concurrent setStatus + retryRefund cannot both reach the gateway.
 */
export const retryRefund = asyncHandler(async (req: Request, res: Response) => {
  const rr = await claimForRefund(req.params.id);
  if (!rr) {
    const existing = await ReturnRequest.findById(req.params.id);
    if (!existing) throw ApiError.notFound("Return request not found");
    if (existing.status !== "refunded") {
      throw ApiError.badRequest(
        "Return must be in refunded state before refunding"
      );
    }
    if (existing.gatewayRefundId) {
      throw ApiError.badRequest(
        `Refund already issued at the gateway (${existing.gatewayRefundId})`
      );
    }
    throw ApiError.badRequest("A refund attempt is already in progress");
  }
  // retryRefund only retries; it does not change status. But if the atomic
  // claim matched a doc whose status wasn't already "refunded" we bail out
  // rather than silently refunding a non-refunded return.
  if (rr.status !== "refunded") {
    // Release the claim and refuse.
    rr.refundStatus = undefined;
    await rr.save();
    throw ApiError.badRequest(
      "Return must be in refunded state before refunding"
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
    // Don't update payment.refundAmount here — the refund.processed webhook
    // is the single source of truth for the accumulated refunded total (it
    // uses $inc to accumulate across partial refunds). Updating here as well
    // would double-count once the webhook arrives.
    await payment.save();

    if (order) {
      order.paymentStatus = "refunded";
      order.status = "refunded";
      await order.save();
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error(`Razorpay refund failed: ${msg}`);
    if (rr.gatewayRefundId) {
      // The gateway refund itself already succeeded (we have the refund id);
      // the exception came from a subsequent bookkeeping save. Don't flip
      // refundStatus back to "failed" — that would mislead the admin into
      // retrying and risk a double refund. Just record the bookkeeping error.
      rr.refundError = `Refund processed at gateway but bookkeeping save failed: ${msg}`;
    } else {
      rr.refundStatus = "failed";
      rr.refundError = msg;
    }
  }
}
