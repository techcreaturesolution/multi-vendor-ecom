import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";

interface Order {
  _id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  grandTotal: number;
  placedAt: string;
}

export default function OrdersPage() {
  const [items, setItems] = useState<Order[]>([]);
  useEffect(() => {
    api.get("/api/customer/orders?limit=50").then((r) => setItems(r.data.data));
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">My Orders</h1>
      <div className="space-y-3">
        {items.map((o) => (
          <Link
            key={o._id}
            to={`/orders/${o._id}`}
            className="flex items-center justify-between bg-white border rounded-lg p-4 hover:shadow-sm"
          >
            <div>
              <div className="font-mono text-sm">{o.orderNumber}</div>
              <div className="text-xs text-gray-500">{new Date(o.placedAt).toLocaleString()}</div>
            </div>
            <div className="text-sm">
              <span className="px-2 py-1 bg-gray-100 rounded text-xs">{o.status}</span>
            </div>
            <div className="font-semibold">₹{o.grandTotal.toLocaleString("en-IN")}</div>
          </Link>
        ))}
        {!items.length && <div className="text-center py-12 text-gray-500">No orders yet</div>}
      </div>
    </div>
  );
}
