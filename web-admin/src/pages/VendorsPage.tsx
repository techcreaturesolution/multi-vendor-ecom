import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../lib/api";

interface Vendor {
  _id: string;
  businessName: string;
  status: "pending" | "approved" | "rejected" | "suspended";
  userId: { name: string; email: string; phone: string };
  createdAt: string;
}

export default function VendorsPage() {
  const [items, setItems] = useState<Vendor[]>([]);
  const [status, setStatus] = useState("");

  const load = async () => {
    const q = status ? `?status=${status}&limit=100` : "?limit=100";
    const r = await api.get(`/api/admin/vendors${q}`);
    setItems(r.data.data);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const approve = async (id: string, approved: boolean) => {
    const reason = approved ? undefined : prompt("Rejection reason?") || "";
    try {
      await api.post(`/api/admin/vendors/${id}/approve`, {
        approved,
        rejectionReason: reason,
      });
      toast.success(approved ? "Approved" : "Rejected");
      load();
    } catch {
      toast.error("Failed");
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Vendors</h1>
      <select
        className="rounded-md border-gray-300 mb-4"
        value={status}
        onChange={(e) => setStatus(e.target.value)}
      >
        <option value="">All</option>
        <option value="pending">Pending</option>
        <option value="approved">Approved</option>
        <option value="rejected">Rejected</option>
        <option value="suspended">Suspended</option>
      </select>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="p-3">Business</th>
              <th className="p-3">Owner</th>
              <th className="p-3">Email</th>
              <th className="p-3">Status</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.map((v) => (
              <tr key={v._id}>
                <td className="p-3 font-medium">{v.businessName}</td>
                <td className="p-3">{v.userId?.name}</td>
                <td className="p-3 text-gray-600">{v.userId?.email}</td>
                <td className="p-3">
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      v.status === "approved"
                        ? "bg-green-100 text-green-800"
                        : v.status === "pending"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {v.status}
                  </span>
                </td>
                <td className="p-3 text-right space-x-2">
                  {v.status === "pending" && (
                    <>
                      <button
                        onClick={() => approve(v._id, true)}
                        className="text-xs px-3 py-1 bg-green-600 text-white rounded"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => approve(v._id, false)}
                        className="text-xs px-3 py-1 bg-red-600 text-white rounded"
                      >
                        Reject
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
