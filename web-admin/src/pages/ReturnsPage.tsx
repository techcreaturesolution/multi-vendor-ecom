import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../lib/api";

type ReturnStatus =
  | "requested"
  | "approved"
  | "rejected"
  | "picked_up"
  | "received"
  | "refunded";

interface ReturnRequest {
  _id: string;
  status: ReturnStatus;
  items: { productId: string | { _id: string; name?: string }; quantity: number; reason: string }[];
  vendorId: { _id: string; businessName: string } | string;
  customerId: { _id: string; name: string; email: string; phone?: string } | string;
  orderId:
    | { _id: string; orderNumber: string; grandTotal: number; status: string }
    | string;
  refundAmount?: number;
  vendorNote?: string;
  gatewayRefundId?: string;
  refundStatus?: "pending" | "processed" | "failed";
  refundError?: string;
  createdAt: string;
}

const NEXT_STATUSES: Record<ReturnStatus, ReturnStatus[]> = {
  requested: ["approved", "rejected"],
  approved: ["picked_up", "rejected"],
  picked_up: ["received"],
  received: ["refunded"],
  refunded: [],
  rejected: [],
};

const statusColor = (s: ReturnStatus) =>
  ({
    requested: "bg-amber-100 text-amber-800",
    approved: "bg-blue-100 text-blue-800",
    picked_up: "bg-indigo-100 text-indigo-800",
    received: "bg-purple-100 text-purple-800",
    refunded: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
  }[s]);

export default function ReturnsPage() {
  const [items, setItems] = useState<ReturnRequest[]>([]);
  const [filter, setFilter] = useState<"all" | ReturnStatus>("all");

  const load = async () => {
    const url =
      filter === "all"
        ? "/api/admin/returns?limit=100"
        : `/api/admin/returns?limit=100&status=${filter}`;
    const r = await api.get(url);
    setItems(r.data.data);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const retry = async (rr: ReturnRequest) => {
    try {
      await api.post(`/api/admin/returns/${rr._id}/refund`);
      toast.success("Refund re-attempted");
      load();
    } catch (err: unknown) {
      toast.error(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          "Refund failed"
      );
    }
  };

  const transition = async (rr: ReturnRequest, next: ReturnStatus) => {
    const body: Record<string, unknown> = { status: next };
    if (next === "refunded") {
      const raw = window.prompt(
        "Refund amount (₹). Leave blank to mark refunded without a recorded amount."
      );
      if (raw && raw.trim()) {
        const amount = Number(raw);
        if (!Number.isFinite(amount) || amount < 0) {
          toast.error("Invalid refund amount");
          return;
        }
        body.refundAmount = amount;
      }
    }
    if (next === "rejected") {
      const note = window.prompt("Reason for rejection (optional)");
      if (note) body.vendorNote = note;
    }
    try {
      await api.patch(`/api/admin/returns/${rr._id}/status`, body);
      toast.success(`Marked ${next}`);
      load();
    } catch (err: unknown) {
      toast.error(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          "Failed"
      );
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Returns</h1>
        <select
          className="rounded-md border-gray-300 text-sm"
          value={filter}
          onChange={(e) => setFilter(e.target.value as "all" | ReturnStatus)}
        >
          <option value="all">All statuses</option>
          <option value="requested">Requested</option>
          <option value="approved">Approved</option>
          <option value="picked_up">Picked up</option>
          <option value="received">Received</option>
          <option value="refunded">Refunded</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="space-y-3">
        {items.map((rr) => {
          const vendor =
            typeof rr.vendorId === "object" ? rr.vendorId.businessName : rr.vendorId;
          const customer = typeof rr.customerId === "object" ? rr.customerId : null;
          const order = typeof rr.orderId === "object" ? rr.orderId : null;
          const next = NEXT_STATUSES[rr.status];

          return (
            <div key={rr._id} className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm text-gray-500">
                    {new Date(rr.createdAt).toLocaleString()}
                  </div>
                  <div className="text-base font-semibold mt-1">
                    Order {order ? order.orderNumber : String(rr.orderId)}
                    {order && (
                      <span className="ml-2 text-sm text-gray-600">
                        (₹{order.grandTotal.toLocaleString("en-IN")})
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-700 mt-1">
                    Vendor: <span className="font-medium">{vendor}</span>
                    {customer && (
                      <>
                        {" "}· Customer:{" "}
                        <span className="font-medium">{customer.name}</span>{" "}
                        <span className="text-gray-500">({customer.email})</span>
                      </>
                    )}
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${statusColor(rr.status)}`}>
                  {rr.status}
                </span>
              </div>

              <ul className="mt-3 text-sm space-y-1">
                {rr.items.map((it, idx) => (
                  <li key={idx} className="text-gray-700">
                    <span className="font-medium">Qty {it.quantity}</span> —{" "}
                    {typeof it.productId === "object"
                      ? it.productId.name || it.productId._id
                      : it.productId}
                    <span className="text-gray-500"> · {it.reason}</span>
                  </li>
                ))}
              </ul>

              {(rr.refundAmount != null ||
                rr.vendorNote ||
                rr.gatewayRefundId ||
                rr.refundStatus) && (
                <div className="mt-3 text-sm text-gray-700 bg-gray-50 rounded-md p-2 space-y-1">
                  {rr.refundAmount != null && (
                    <div>
                      Refund recorded:{" "}
                      <b>₹{rr.refundAmount.toLocaleString("en-IN")}</b>
                    </div>
                  )}
                  {rr.refundStatus && (
                    <div>
                      Gateway:{" "}
                      <span
                        className={
                          rr.refundStatus === "processed"
                            ? "text-green-700"
                            : rr.refundStatus === "failed"
                            ? "text-red-700"
                            : "text-amber-700"
                        }
                      >
                        {rr.refundStatus}
                      </span>
                      {rr.gatewayRefundId && (
                        <span className="ml-2 font-mono text-xs text-gray-500">
                          {rr.gatewayRefundId}
                        </span>
                      )}
                    </div>
                  )}
                  {rr.refundError && (
                    <div className="text-red-700 text-xs">Error: {rr.refundError}</div>
                  )}
                  {rr.vendorNote && <div>Note: {rr.vendorNote}</div>}
                  {rr.status === "refunded" && rr.refundStatus !== "processed" && (
                    <button
                      onClick={() => retry(rr)}
                      className="mt-1 text-xs px-3 py-1.5 rounded-md border border-primary-300 text-primary-700 hover:bg-primary-50"
                    >
                      Retry Razorpay refund
                    </button>
                  )}
                </div>
              )}

              {next.length > 0 && (
                <div className="mt-3 flex gap-2">
                  {next.map((s) => (
                    <button
                      key={s}
                      onClick={() => transition(rr, s)}
                      className={`text-xs px-3 py-1.5 rounded-md border ${
                        s === "rejected"
                          ? "border-red-300 text-red-700 hover:bg-red-50"
                          : "border-primary-300 text-primary-700 hover:bg-primary-50"
                      }`}
                    >
                      Mark {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {!items.length && (
          <div className="bg-white rounded-lg p-8 text-center text-gray-500">
            No returns match this filter
          </div>
        )}
      </div>
    </div>
  );
}
