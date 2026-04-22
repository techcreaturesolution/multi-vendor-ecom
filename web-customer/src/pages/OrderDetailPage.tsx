import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../lib/api";

interface OrderItem {
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

  useEffect(() => {
    api.get(`/api/customer/orders/${id}`).then((r) => {
      setOrder(r.data.data.order);
      setShipments(r.data.data.shipments);
    });
  }, [id]);

  if (!order) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold">Order {order.orderNumber}</h1>
      <div className="text-sm text-gray-500 mt-1">
        Status: <span className="px-2 py-1 bg-gray-100 rounded">{order.status}</span> · Payment:{" "}
        <span className="px-2 py-1 bg-gray-100 rounded">{order.paymentStatus}</span>
      </div>

      <h2 className="mt-6 font-medium">Items</h2>
      <div className="bg-white border rounded-lg divide-y">
        {order.items.map((i, idx) => (
          <div key={idx} className="p-4 flex justify-between text-sm">
            <div>
              <div className="font-medium">{i.name}</div>
              <div className="text-gray-500">{i.sku} · Qty {i.quantity}</div>
            </div>
            <div className="font-semibold">₹{i.subtotal.toLocaleString("en-IN")}</div>
          </div>
        ))}
        <div className="p-4 text-sm flex justify-between">
          <span>Subtotal</span><span>₹{order.subtotal.toLocaleString("en-IN")}</span>
        </div>
        <div className="p-4 text-sm flex justify-between">
          <span>Shipping</span><span>₹{order.shippingTotal.toLocaleString("en-IN")}</span>
        </div>
        <div className="p-4 flex justify-between font-semibold">
          <span>Total</span><span>₹{order.grandTotal.toLocaleString("en-IN")}</span>
        </div>
      </div>

      <h2 className="mt-6 font-medium">Ship to</h2>
      <div className="bg-white border rounded-lg p-4 text-sm">
        {order.shippingAddress.fullName} · {order.shippingAddress.phone}
        <br />
        {order.shippingAddress.line1}, {order.shippingAddress.city}, {order.shippingAddress.state} -{" "}
        {order.shippingAddress.pincode}
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
    </div>
  );
}
