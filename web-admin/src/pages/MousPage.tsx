import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../lib/api";

interface Vendor {
  _id: string;
  businessName: string;
  status: string;
}

interface MOU {
  _id: string;
  vendorId: { _id: string; businessName: string } | string;
  adminCommissionPercent: number;
  effectiveFrom: string;
  effectiveTo?: string;
  isActive: boolean;
  terms: string;
}

export default function MousPage() {
  const [items, setItems] = useState<MOU[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({
    vendorId: "",
    adminCommissionPercent: 10,
    effectiveFrom: new Date().toISOString().slice(0, 10),
    terms: "",
  });

  const load = async () => {
    const [m, v] = await Promise.all([
      api.get("/api/admin/mous?limit=200"),
      api.get("/api/admin/vendors?status=approved&limit=200"),
    ]);
    setItems(m.data.data);
    setVendors(v.data.data);
  };

  useEffect(() => {
    load();
  }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/api/admin/mous", {
        ...form,
        adminCommissionPercent: Number(form.adminCommissionPercent),
      });
      toast.success("MOU created");
      setShowNew(false);
      setForm({
        vendorId: "",
        adminCommissionPercent: 10,
        effectiveFrom: new Date().toISOString().slice(0, 10),
        terms: "",
      });
      load();
    } catch (err: unknown) {
      toast.error(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          "Failed"
      );
    }
  };

  const deactivate = async (id: string) => {
    if (!confirm("Deactivate this MOU?")) return;
    await api.post(`/api/admin/mous/${id}/deactivate`);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">MOUs</h1>
        <button
          onClick={() => setShowNew(!showNew)}
          className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm"
        >
          {showNew ? "Cancel" : "+ New MOU"}
        </button>
      </div>

      {showNew && (
        <form onSubmit={create} className="bg-white rounded-lg p-5 shadow-sm mb-6 grid grid-cols-2 gap-3">
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
            Commission %
            <input
              type="number"
              min={0}
              max={100}
              step={0.1}
              className="mt-1 w-full rounded-md border-gray-300"
              value={form.adminCommissionPercent}
              onChange={(e) =>
                setForm({ ...form, adminCommissionPercent: Number(e.target.value) })
              }
              required
            />
          </label>
          <label className="block text-sm">
            Effective From
            <input
              type="date"
              className="mt-1 w-full rounded-md border-gray-300"
              value={form.effectiveFrom}
              onChange={(e) => setForm({ ...form, effectiveFrom: e.target.value })}
              required
            />
          </label>
          <label className="block text-sm col-span-2">
            Terms
            <textarea
              rows={3}
              className="mt-1 w-full rounded-md border-gray-300"
              value={form.terms}
              onChange={(e) => setForm({ ...form, terms: e.target.value })}
              required
            />
          </label>
          <button className="col-span-2 bg-primary-600 text-white rounded-md py-2">Create</button>
        </form>
      )}

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="p-3">Vendor</th>
              <th className="p-3">Commission %</th>
              <th className="p-3">Effective From</th>
              <th className="p-3">Status</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.map((m) => (
              <tr key={m._id}>
                <td className="p-3 font-medium">
                  {typeof m.vendorId === "object" ? m.vendorId.businessName : m.vendorId}
                </td>
                <td className="p-3">{m.adminCommissionPercent}%</td>
                <td className="p-3">{new Date(m.effectiveFrom).toLocaleDateString()}</td>
                <td className="p-3">
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      m.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {m.isActive ? "active" : "inactive"}
                  </span>
                </td>
                <td className="p-3 text-right">
                  {m.isActive && (
                    <button
                      onClick={() => deactivate(m._id)}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Deactivate
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {!items.length && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500">
                  No MOUs yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
