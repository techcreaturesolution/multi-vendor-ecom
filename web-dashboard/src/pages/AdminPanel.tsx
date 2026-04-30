import { useEffect, useState, useCallback } from "react";
import { Shield, Ban, CheckCircle, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import api from "../services/api";

interface AdminTenant {
  _id: string;
  name: string;
  slug: string;
  plan: string;
  status: string;
  messagesUsed: number;
  messageQuota: number;
  createdAt: string;
}

export default function AdminPanel() {
  const [tenants, setTenants] = useState<AdminTenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [superStats, setSuperStats] = useState<Record<string, unknown> | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [tenantsRes, statsRes] = await Promise.all([
        api.get("/admin/tenants"),
        api.get("/analytics/super-admin"),
      ]);
      setTenants(tenantsRes.data.tenants);
      setSuperStats(statsRes.data);
    } catch {
      toast.error("Failed to load admin data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSuspend = async (id: string) => {
    try {
      await api.post(`/admin/tenants/${id}/suspend`);
      toast.success("Tenant suspended");
      fetchData();
    } catch {
      toast.error("Failed to suspend");
    }
  };

  const handleActivate = async (id: string) => {
    try {
      await api.post(`/admin/tenants/${id}/activate`);
      toast.success("Tenant activated");
      fetchData();
    } catch {
      toast.error("Failed to activate");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this tenant and all associated data?")) return;
    try {
      await api.delete(`/admin/tenants/${id}`);
      toast.success("Tenant deleted");
      fetchData();
    } catch {
      toast.error("Failed to delete");
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" /></div>;
  }

  const stats = superStats as { tenants?: { total: number; active: number }; messages?: { total: number }; campaigns?: { total: number } } | null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Shield className="w-6 h-6 text-primary-700" />
        <h1 className="text-2xl font-bold">Super Admin Panel</h1>
      </div>

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border p-4 text-center">
            <div className="text-2xl font-bold">{stats.tenants?.total || 0}</div>
            <div className="text-sm text-gray-500">Total Tenants</div>
          </div>
          <div className="bg-white rounded-xl border p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.tenants?.active || 0}</div>
            <div className="text-sm text-gray-500">Active</div>
          </div>
          <div className="bg-white rounded-xl border p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.messages?.total || 0}</div>
            <div className="text-sm text-gray-500">Total Messages</div>
          </div>
          <div className="bg-white rounded-xl border p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.campaigns?.total || 0}</div>
            <div className="text-sm text-gray-500">Total Campaigns</div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="px-4 py-3 font-medium">Business</th>
              <th className="px-4 py-3 font-medium">Plan</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Usage</th>
              <th className="px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3 font-medium w-32">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((t) => (
              <tr key={t._id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{t.name}</td>
                <td className="px-4 py-3 capitalize">{t.plan}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${t.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {t.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{t.messagesUsed} / {t.messageQuota}</td>
                <td className="px-4 py-3 text-gray-500">{new Date(t.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    {t.status === "active" ? (
                      <button onClick={() => handleSuspend(t._id)} className="p-1 text-orange-500 hover:bg-orange-50 rounded" title="Suspend">
                        <Ban className="w-4 h-4" />
                      </button>
                    ) : (
                      <button onClick={() => handleActivate(t._id)} className="p-1 text-green-500 hover:bg-green-50 rounded" title="Activate">
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={() => handleDelete(t._id)} className="p-1 text-red-500 hover:bg-red-50 rounded" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
