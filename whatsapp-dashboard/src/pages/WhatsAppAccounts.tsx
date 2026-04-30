import { useEffect, useState, useCallback } from "react";
import { Plus, Trash2, Smartphone, CheckCircle, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import api from "../services/api";
import type { WhatsAppAccount } from "../types";

export default function WhatsAppAccounts() {
  const [accounts, setAccounts] = useState<WhatsAppAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", phoneNumber: "", phoneNumberId: "", wabaId: "", accessToken: "" });

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/whatsapp-accounts");
      setAccounts(res.data.accounts);
    } catch {
      toast.error("Failed to load accounts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/whatsapp-accounts", form);
      toast.success("Account added");
      setShowAdd(false);
      setForm({ name: "", phoneNumber: "", phoneNumberId: "", wabaId: "", accessToken: "" });
      fetchAccounts();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error || "Failed to add account");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this WhatsApp account?")) return;
    try {
      await api.delete(`/whatsapp-accounts/${id}`);
      toast.success("Account removed");
      fetchAccounts();
    } catch {
      toast.error("Failed to remove");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">WhatsApp Accounts</h1>
        <button onClick={() => setShowAdd(!showAdd)} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Account
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="bg-white rounded-xl border p-4 mb-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Account Name *" required className="px-3 py-2 border rounded-lg text-sm" />
            <input value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} placeholder="Phone Number *" required className="px-3 py-2 border rounded-lg text-sm" />
            <input value={form.phoneNumberId} onChange={(e) => setForm({ ...form, phoneNumberId: e.target.value })} placeholder="Phone Number ID (Meta) *" required className="px-3 py-2 border rounded-lg text-sm" />
            <input value={form.wabaId} onChange={(e) => setForm({ ...form, wabaId: e.target.value })} placeholder="WABA ID *" required className="px-3 py-2 border rounded-lg text-sm" />
          </div>
          <input value={form.accessToken} onChange={(e) => setForm({ ...form, accessToken: e.target.value })} placeholder="Access Token *" required type="password" className="w-full px-3 py-2 border rounded-lg text-sm" />
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm">Connect</button>
            <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 border rounded-lg text-sm">Cancel</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-center py-8 text-gray-400">Loading...</div>
      ) : accounts.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Smartphone className="w-12 h-12 mx-auto mb-3" />
          <p>No WhatsApp accounts connected</p>
          <p className="text-sm mt-1">Click &quot;Add Account&quot; to connect your first number</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {accounts.map((acc) => (
            <div key={acc._id} className="bg-white rounded-xl border p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Smartphone className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold">{acc.name}</h3>
                  <p className="text-sm text-gray-500">{acc.phoneNumber}</p>
                  <p className="text-xs text-gray-400">ID: {acc.phoneNumberId}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`flex items-center gap-1 text-xs font-medium ${acc.status === "active" ? "text-green-600" : "text-red-600"}`}>
                  {acc.status === "active" ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  {acc.status}
                </span>
                <button onClick={() => handleDelete(acc._id)} className="p-2 text-gray-400 hover:text-red-500 rounded-lg">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
