import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../lib/api";

interface Order {
  _id: string;
  orderNumber: string;
  customerId: { name: string; email: string };
  grandTotal: number;
  status: string;
  paymentStatus: string;
  placedAt: string;
}

export default function OrdersPage() {
  const [items, setItems] = useState<Order[]>([]);
  const load = async () => {
    const r = await api.get("/api/vendor/orders?limit=100");
    setItems(r.data.data);
  };
  useEffect(() => { load(); }, []);

  const ship = async (id: string) => {
    try {
      await api.post(`/api/vendor/orders/${id}/ship`);
      toast.success("Shipment booked");
      load();
    } catch (err: unknown) {
      toast.error(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed"
      );
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Orders</h1>
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="p-3">Order #</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Total</th>
              <th className="p-3">Status</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.map((o) => (
              <tr key={o._id}>
                <td className="p-3 font-mono">{o.orderNumber}</td>
                <td className="p-3">{o.customerId?.name}<div className="text-xs text-gray-500">{o.customerId?.email}</div></td>
                <td className="p-3">₹{o.grandTotal.toLocaleString("en-IN")}</td>
                <td className="p-3">
                  <span className="text-xs px-2 py-1 rounded bg-gray-100">{o.status}</span>
                </td>
                <td className="p-3 text-right">
                  {o.paymentStatus === "paid" && ["paid", "processing"].includes(o.status) && (
                    <button
                      onClick={() => ship(o._id)}
                      className="text-xs px-3 py-1 bg-primary-600 text-white rounded"
                    >
                      Ship
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {!items.length && <tr><td colSpan={5} className="p-8 text-center text-gray-500">No orders yet</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
