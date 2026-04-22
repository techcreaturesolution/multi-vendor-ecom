import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../lib/api";

interface Vendor {
  _id: string;
  businessName: string;
}

interface Payout {
  _id: string;
  vendorId: { _id: string; businessName: string } | string;
  periodStart: string;
  periodEnd: string;
  grossSales: number;
  totalShipping: number;
  totalCommission: number;
  netPayable: number;
  status: "pending" | "processing" | "paid" | "failed";
  utrNumber?: string;
  paidAt?: string;
}

export default function PayoutsPage() {
  const [items, setItems] = useState<Payout[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [showGen, setShowGen] = useState(false);
  const [form, setForm] = useState({
    vendorId: "",
    periodStart: new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10),
    periodEnd: new Date().toISOString().slice(0, 10),
  });

  const load = async () => {
    const [p, v] = await Promise.all([
      api.get("/api/admin/payouts?limit=100"),
      api.get("/api/admin/vendors?status=approved&limit=200"),
    ]);
    setItems(p.data.data);
    setVendors(v.data.data);
  };

  useEffect(() => {
    load();
  }, []);

  const generate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/api/admin/payouts/generate", form);
      toast.success("Payout generated");
      setShowGen(false);
      load();
    } catch (err: unknown) {
      toast.error(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          "Failed"
      );
    }
  };

  const markPaid = async (id: string) => {
    const utr = prompt("Enter UTR / bank reference number:");
    if (!utr) return;
    try {
      await api.post(`/api/admin/payouts/${id}/mark-paid`, { utrNumber: utr });
      toast.success("Marked as paid");
      load();
    } catch {
      toast.error("Failed");
    }
  };

  const statusColor = (s: Payout["status"]) =>
    s === "paid"
      ? "bg-green-100 text-green-800"
      : s === "processing"
      ? "bg-blue-100 text-blue-800"
      : s === "failed"
      ? "bg-red-100 text-red-800"
      : "bg-amber-100 text-amber-800";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Payouts</h1>
        <button
          onClick={() => setShowGen(!showGen)}
          className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm"
        >
          {showGen ? "Cancel" : "+ Generate payout"}
        </button>
      </div>

      {showGen && (
        <form onSubmit={generate} className="bg-white rounded-lg p-5 shadow-sm mb-6 grid grid-cols-3 gap-3">
          <label className="block text-sm">
            Vendor
            <select
              className="mt-1 w-full rounded-md border-gray-300"
              value={form.vendorId}
              onChange={(e) => setForm({ ...form, vendorId: e.target.value })}
              required
            >
              <option value="">Select...</option>
              {vendors.map((v) => (
                <option key={v._id} value={v._id}>
                  {v.businessName}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            From
            <input
              type="date"
              className="mt-1 w-full rounded-md border-gray-300"
              value={form.periodStart}
              onChange={(e) => setForm({ ...form, periodStart: e.target.value })}
              required
            />
          </label>
          <label className="block text-sm">
            To
            <input
              type="date"
              className="mt-1 w-full rounded-md border-gray-300"
              value={form.periodEnd}
              onChange={(e) => setForm({ ...form, periodEnd: e.target.value })}
              required
            />
          </label>
          <button className="col-span-3 bg-primary-600 text-white rounded-md py-2">
            Generate (aggregates delivered orders in range)
          </button>
        </form>
      )}

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="p-3">Vendor</th>
              <th className="p-3">Period</th>
              <th className="p-3">Gross</th>
              <th className="p-3">Shipping</th>
              <th className="p-3">Commission</th>
              <th className="p-3">Net payable</th>
              <th className="p-3">Status</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.map((p) => (
              <tr key={p._id}>
                <td className="p-3 font-medium">
                  {typeof p.vendorId === "object" ? p.vendorId.businessName : p.vendorId}
                </td>
                <td className="p-3 text-gray-600">
                  {new Date(p.periodStart).toLocaleDateString()} →{" "}
                  {new Date(p.periodEnd).toLocaleDateString()}
                </td>
                <td className="p-3">₹{p.grossSales.toLocaleString("en-IN")}</td>
                <td className="p-3">₹{p.totalShipping.toLocaleString("en-IN")}</td>
                <td className="p-3">₹{p.totalCommission.toLocaleString("en-IN")}</td>
                <td className="p-3 font-semibold">₹{p.netPayable.toLocaleString("en-IN")}</td>
                <td className="p-3">
                  <span className={`text-xs px-2 py-1 rounded ${statusColor(p.status)}`}>
                    {p.status}
                  </span>
                  {p.utrNumber && (
                    <div className="text-xs text-gray-500 mt-1">UTR: {p.utrNumber}</div>
                  )}
                </td>
                <td className="p-3 text-right">
                  {p.status === "processing" && (
                    <button
                      onClick={() => markPaid(p._id)}
                      className="text-xs px-3 py-1 bg-green-600 text-white rounded"
                    >
                      Mark paid
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {!items.length && (
              <tr>
                <td colSpan={8} className="p-8 text-center text-gray-500">
                  No payouts yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
