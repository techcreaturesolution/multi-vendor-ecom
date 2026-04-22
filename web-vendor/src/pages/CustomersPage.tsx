import { useEffect, useState } from "react";
import { api } from "../lib/api";

interface Customer {
  _id: string;
  name: string;
  email: string;
  phone: string;
  orderCount: number;
  totalSpent: number;
  lastOrderAt: string;
}

export default function CustomersPage() {
  const [items, setItems] = useState<Customer[]>([]);

  useEffect(() => {
    api.get("/api/vendor/customers?limit=100").then((r) => setItems(r.data.data));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Customers</h1>
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Contact</th>
              <th className="p-3">Orders</th>
              <th className="p-3">Total spent</th>
              <th className="p-3">Last order</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.map((c) => (
              <tr key={c._id}>
                <td className="p-3 font-medium">{c.name}</td>
                <td className="p-3 text-gray-600">
                  {c.email}
                  <div className="text-xs text-gray-500">{c.phone}</div>
                </td>
                <td className="p-3">{c.orderCount}</td>
                <td className="p-3">₹{c.totalSpent.toLocaleString("en-IN")}</td>
                <td className="p-3 text-gray-600">
                  {c.lastOrderAt ? new Date(c.lastOrderAt).toLocaleDateString() : "-"}
                </td>
              </tr>
            ))}
            {!items.length && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500">
                  No customers have ordered from you yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
