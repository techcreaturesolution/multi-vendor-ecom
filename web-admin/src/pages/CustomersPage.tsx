import { useEffect, useState } from "react";
import { api } from "../lib/api";

interface Customer {
  _id: string;
  name: string;
  email: string;
  phone: string;
  isActive: boolean;
  createdAt: string;
}

export default function CustomersPage() {
  const [items, setItems] = useState<Customer[]>([]);
  const [q, setQ] = useState("");

  const load = async () => {
    const qs = new URLSearchParams({ limit: "100" });
    if (q) qs.append("q", q);
    const r = await api.get(`/api/admin/customers?${qs.toString()}`);
    setItems(r.data.data);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = async (c: Customer) => {
    await api.patch(`/api/admin/customers/${c._id}/status`, { isActive: !c.isActive });
    load();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Customers</h1>
      <div className="flex gap-2 mb-4">
        <input
          placeholder="Search by name / email / phone"
          className="rounded-md border-gray-300 flex-1 max-w-md"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load()}
        />
        <button
          onClick={load}
          className="bg-primary-600 hover:bg-primary-700 text-white px-4 rounded-md text-sm"
        >
          Search
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Phone</th>
              <th className="p-3">Status</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.map((c) => (
              <tr key={c._id}>
                <td className="p-3 font-medium">{c.name}</td>
                <td className="p-3 text-gray-600">{c.email}</td>
                <td className="p-3 text-gray-600">{c.phone}</td>
                <td className="p-3">
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      c.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {c.isActive ? "active" : "blocked"}
                  </span>
                </td>
                <td className="p-3 text-right">
                  <button
                    onClick={() => toggle(c)}
                    className="text-xs text-gray-700 hover:underline"
                  >
                    {c.isActive ? "Block" : "Unblock"}
                  </button>
                </td>
              </tr>
            ))}
            {!items.length && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500">
                  No customers
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
