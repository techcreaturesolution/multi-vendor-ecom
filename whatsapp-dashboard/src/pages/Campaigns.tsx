import { useEffect, useState, useCallback } from "react";
import { Plus, Play, Pause, XCircle, Eye } from "lucide-react";
import toast from "react-hot-toast";
import api from "../services/api";
import type { Campaign, WhatsAppAccount } from "../types";

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  queued: "bg-yellow-100 text-yellow-700",
  in_progress: "bg-blue-100 text-blue-700",
  paused: "bg-orange-100 text-orange-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [accounts, setAccounts] = useState<WhatsAppAccount[]>([]);
  const [form, setForm] = useState({
    name: "", waAccountId: "", templateName: "", templateLanguage: "en",
    bodyParams: "", contactTags: "",
  });
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [detail, setDetail] = useState<{ campaign: Campaign; messages: unknown[] } | null>(null);

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/campaigns");
      setCampaigns(res.data.campaigns);
    } catch {
      toast.error("Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

  const openCreate = async () => {
    try {
      const res = await api.get("/whatsapp-accounts");
      setAccounts(res.data.accounts);
    } catch { /* empty */ }
    setShowCreate(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/campaigns", {
        ...form,
        bodyParams: form.bodyParams ? form.bodyParams.split(",").map((s) => s.trim()) : [],
        contactTags: form.contactTags ? form.contactTags.split(",").map((s) => s.trim()) : [],
      });
      toast.success("Campaign created");
      setShowCreate(false);
      setForm({ name: "", waAccountId: "", templateName: "", templateLanguage: "en", bodyParams: "", contactTags: "" });
      fetchCampaigns();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error || "Failed to create campaign");
    }
  };

  const handleAction = async (id: string, action: "start" | "pause" | "cancel") => {
    try {
      await api.post(`/campaigns/${id}/${action}`);
      toast.success(`Campaign ${action}ed`);
      fetchCampaigns();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error || `Failed to ${action} campaign`);
    }
  };

  const viewDetail = async (id: string) => {
    try {
      const res = await api.get(`/campaigns/${id}`);
      setDetail(res.data);
      setSelectedCampaign(id);
    } catch {
      toast.error("Failed to load campaign details");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Campaigns</h1>
        <button onClick={openCreate} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Campaign
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl border p-4 mb-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Campaign Name *" required className="px-3 py-2 border rounded-lg text-sm" />
            <select value={form.waAccountId} onChange={(e) => setForm({ ...form, waAccountId: e.target.value })} required className="px-3 py-2 border rounded-lg text-sm">
              <option value="">Select WhatsApp Account *</option>
              {accounts.map((a) => <option key={a._id} value={a._id}>{a.name} ({a.phoneNumber})</option>)}
            </select>
            <input value={form.templateName} onChange={(e) => setForm({ ...form, templateName: e.target.value })} placeholder="Template Name *" required className="px-3 py-2 border rounded-lg text-sm" />
            <input value={form.templateLanguage} onChange={(e) => setForm({ ...form, templateLanguage: e.target.value })} placeholder="Language (en)" className="px-3 py-2 border rounded-lg text-sm" />
            <input value={form.bodyParams} onChange={(e) => setForm({ ...form, bodyParams: e.target.value })} placeholder="Body Params (comma-sep)" className="px-3 py-2 border rounded-lg text-sm" />
            <input value={form.contactTags} onChange={(e) => setForm({ ...form, contactTags: e.target.value })} placeholder="Contact Tags (comma-sep)" className="px-3 py-2 border rounded-lg text-sm" />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm">Create</button>
            <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 border rounded-lg text-sm">Cancel</button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-8 text-gray-400">Loading...</div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-8 text-gray-400">No campaigns yet</div>
        ) : campaigns.map((c) => (
          <div key={c._id} className="bg-white rounded-xl border p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold">{c.name}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[c.status]}`}>
                    {c.status.replace("_", " ")}
                  </span>
                </div>
                <p className="text-sm text-gray-500">Template: {c.templateName} &middot; {c.stats.total} contacts</p>
              </div>
              <div className="flex gap-1">
                {(c.status === "draft" || c.status === "paused") && (
                  <button onClick={() => handleAction(c._id, "start")} className="p-2 text-green-600 hover:bg-green-50 rounded-lg" title="Start">
                    <Play className="w-4 h-4" />
                  </button>
                )}
                {(c.status === "queued" || c.status === "in_progress") && (
                  <button onClick={() => handleAction(c._id, "pause")} className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg" title="Pause">
                    <Pause className="w-4 h-4" />
                  </button>
                )}
                {c.status !== "completed" && c.status !== "cancelled" && (
                  <button onClick={() => handleAction(c._id, "cancel")} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Cancel">
                    <XCircle className="w-4 h-4" />
                  </button>
                )}
                <button onClick={() => viewDetail(c._id)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="View">
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-5 gap-2 text-center text-xs">
              <div><div className="font-semibold text-gray-900">{c.stats.queued}</div><div className="text-gray-400">Queued</div></div>
              <div><div className="font-semibold text-blue-600">{c.stats.sent}</div><div className="text-gray-400">Sent</div></div>
              <div><div className="font-semibold text-green-600">{c.stats.delivered}</div><div className="text-gray-400">Delivered</div></div>
              <div><div className="font-semibold text-purple-600">{c.stats.read}</div><div className="text-gray-400">Read</div></div>
              <div><div className="font-semibold text-red-600">{c.stats.failed}</div><div className="text-gray-400">Failed</div></div>
            </div>
          </div>
        ))}
      </div>

      {selectedCampaign && detail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedCampaign(null)}>
          <div className="bg-white rounded-xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">{detail.campaign.name}</h2>
            <div className="grid grid-cols-3 gap-3 text-center mb-4">
              <div className="bg-blue-50 p-3 rounded-lg"><div className="text-lg font-bold text-blue-600">{detail.campaign.stats.sent}</div><div className="text-xs text-gray-500">Sent</div></div>
              <div className="bg-green-50 p-3 rounded-lg"><div className="text-lg font-bold text-green-600">{detail.campaign.stats.delivered}</div><div className="text-xs text-gray-500">Delivered</div></div>
              <div className="bg-red-50 p-3 rounded-lg"><div className="text-lg font-bold text-red-600">{detail.campaign.stats.failed}</div><div className="text-xs text-gray-500">Failed</div></div>
            </div>
            <button onClick={() => setSelectedCampaign(null)} className="w-full py-2 border rounded-lg text-sm">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
