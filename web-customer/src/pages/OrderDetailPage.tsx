import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "../lib/api";

interface OrderItem {
  productId: string;
  name: string;
  sku: string;
  quantity: number;
  price: number;
  subtotal: number;
}

interface Shipment {
  _id: string;
  awbNumber?: string;
  courierName?: string;
  status: string;
  trackingEvents: { status: string; message?: string; at: string }[];
}

interface Order {
  _id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  grandTotal: number;
  shippingTotal: number;
  subtotal: number;
  items: OrderItem[];
  shippingAddress: {
    fullName: string;
    phone: string;
    line1: string;
    city: string;
    state: string;
    pincode: string;
  };
}

export default function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [shipments, setShipments] = useState<Shipment[]>([]);

  const load = () => {
    api.get(`/api/customer/orders/${id}`).then((r) => {
      setOrder(r.data.data.order);
      setShipments(r.data.data.shipments);
    });
  };
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const [reviewFor, setReviewFor] = useState<OrderItem | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");

  const [returnOpen, setReturnOpen] = useState(false);
  const [returnItems, setReturnItems] = useState<Record<string, { qty: number; reason: string }>>(
    {}
  );

  const submitReview = async () => {
    if (!reviewFor || !order) return;
    try {
      await api.post("/api/customer/reviews", {
        productId: reviewFor.productId,
        orderId: order._id,
        rating: reviewRating,
        comment: reviewText,
      });
      toast.success("Review submitted");
      setReviewFor(null);
      setReviewText("");
      setReviewRating(5);
    } catch (err: unknown) {
      toast.error(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          "Failed"
      );
    }
  };

  const submitReturn = async () => {
    if (!order) return;
    const items = Object.entries(returnItems)
      .filter(([, v]) => v.qty > 0 && v.reason.trim().length > 0)
      .map(([productId, v]) => ({ productId, quantity: v.qty, reason: v.reason.trim() }));
    if (!items.length) {
      toast.error("Pick at least one item with a reason");
      return;
    }
    try {
      await api.post("/api/customer/returns", { orderId: order._id, items });
      toast.success("Return request submitted");
      setReturnOpen(false);
      setReturnItems({});
      load();
    } catch (err: unknown) {
      toast.error(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          "Failed"
      );
    }
  };

  if (!order) return <div className="p-8 text-center">Loading...</div>;

  const canReviewOrReturn = order.status === "delivered";

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-start justify-between">
        <h1 className="text-2xl font-bold">Order {order.orderNumber}</h1>
        {canReviewOrReturn && (
          <button
            onClick={() => setReturnOpen(true)}
            className="text-sm px-3 py-2 border rounded-md hover:bg-gray-50"
          >
            Request return
          </button>
        )}
      </div>
      <div className="text-sm text-gray-500 mt-1">
        Status: <span className="px-2 py-1 bg-gray-100 rounded">{order.status}</span> · Payment:{" "}
        <span className="px-2 py-1 bg-gray-100 rounded">{order.paymentStatus}</span>
      </div>

      <h2 className="mt-6 font-medium">Items</h2>
      <div className="bg-white border rounded-lg divide-y">
        {order.items.map((i) => (
          <div key={i.productId} className="p-4 flex justify-between text-sm items-center">
            <div>
              <div className="font-medium">{i.name}</div>
              <div className="text-gray-500">
                {i.sku} · Qty {i.quantity}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="font-semibold">₹{i.subtotal.toLocaleString("en-IN")}</div>
              {canReviewOrReturn && (
                <button
                  onClick={() => setReviewFor(i)}
                  className="text-xs text-primary-700 hover:underline"
                >
                  Review
                </button>
              )}
            </div>
          </div>
        ))}
        <div className="p-4 text-sm flex justify-between">
          <span>Subtotal</span>
          <span>₹{order.subtotal.toLocaleString("en-IN")}</span>
        </div>
        <div className="p-4 text-sm flex justify-between">
          <span>Shipping</span>
          <span>₹{order.shippingTotal.toLocaleString("en-IN")}</span>
        </div>
        <div className="p-4 flex justify-between font-semibold">
          <span>Total</span>
          <span>₹{order.grandTotal.toLocaleString("en-IN")}</span>
        </div>
      </div>

      <h2 className="mt-6 font-medium">Ship to</h2>
      <div className="bg-white border rounded-lg p-4 text-sm">
        {order.shippingAddress.fullName} · {order.shippingAddress.phone}
        <br />
        {order.shippingAddress.line1}, {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
        - {order.shippingAddress.pincode}
      </div>

      {shipments.length > 0 && (
        <>
          <h2 className="mt-6 font-medium">Tracking</h2>
          <div className="space-y-3">
            {shipments.map((s) => (
              <div key={s._id} className="bg-white border rounded-lg p-4">
                <div className="text-sm">
                  <b>{s.courierName || "—"}</b> · AWB {s.awbNumber || "—"} ·{" "}
                  <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">{s.status}</span>
                </div>
                <ul className="mt-3 space-y-1 text-sm">
                  {s.trackingEvents.map((e, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="text-gray-400 text-xs w-36">
                        {new Date(e.at).toLocaleString()}
                      </span>
                      <span>{e.message || e.status}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}

      {reviewFor && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-1">Review</h2>
            <p className="text-sm text-gray-500 mb-4">{reviewFor.name}</p>
            <div className="flex gap-1 mb-3">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setReviewRating(n)}
                  className={`text-2xl ${n <= reviewRating ? "text-amber-400" : "text-gray-300"}`}
                >
                  ★
                </button>
              ))}
            </div>
            <textarea
              placeholder="Tell others about the product..."
              rows={4}
              className="w-full rounded-md border-gray-300"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setReviewFor(null)}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={submitReview}
                className="px-4 py-2 text-sm bg-primary-600 text-white rounded-md"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {returnOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Request return</h2>
            <div className="space-y-3">
              {order.items.map((i) => {
                const v = returnItems[i.productId] || { qty: 0, reason: "" };
                return (
                  <div key={i.productId} className="border rounded-md p-3">
                    <div className="text-sm font-medium">{i.name}</div>
                    <div className="text-xs text-gray-500 mb-2">Ordered qty: {i.quantity}</div>
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="number"
                        min={0}
                        max={i.quantity}
                        placeholder="Qty"
                        className="rounded-md border-gray-300 text-sm"
                        value={v.qty || ""}
                        onChange={(e) =>
                          setReturnItems({
                            ...returnItems,
                            [i.productId]: { ...v, qty: Number(e.target.value) },
                          })
                        }
                      />
                      <input
                        placeholder="Reason (required if qty > 0)"
                        className="col-span-2 rounded-md border-gray-300 text-sm"
                        value={v.reason}
                        onChange={(e) =>
                          setReturnItems({
                            ...returnItems,
                            [i.productId]: { ...v, reason: e.target.value },
                          })
                        }
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setReturnOpen(false)}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={submitReturn}
                className="px-4 py-2 text-sm bg-primary-600 text-white rounded-md"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
