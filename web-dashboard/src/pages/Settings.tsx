import { useState } from "react";
import { Plus } from "lucide-react";
import toast from "react-hot-toast";
import api from "../services/api";
import { useAuth } from "../store/AuthContext";

export default function Settings() {
  const { user, tenant } = useAuth();
  const [showAddAgent, setShowAddAgent] = useState(false);
  const [agentForm, setAgentForm] = useState({ name: "", email: "", password: "" });

  const handleAddAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/auth/agents", agentForm);
      toast.success("Agent added successfully");
      setShowAddAgent(false);
      setAgentForm({ name: "", email: "", password: "" });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error || "Failed to add agent");
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <div className="space-y-6">
        <div className="bg-white rounded-xl border p-5">
          <h2 className="text-lg font-semibold mb-4">Account Info</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <label className="text-gray-500">Name</label>
              <p className="font-medium">{user?.name}</p>
            </div>
            <div>
              <label className="text-gray-500">Email</label>
              <p className="font-medium">{user?.email}</p>
            </div>
            <div>
              <label className="text-gray-500">Role</label>
              <p className="font-medium capitalize">{user?.role.replace("_", " ")}</p>
            </div>
            <div>
              <label className="text-gray-500">Business</label>
              <p className="font-medium">{tenant?.name || "N/A"}</p>
            </div>
          </div>
        </div>

        {user?.role === "tenant_admin" && (
          <div className="bg-white rounded-xl border p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Team Management</h2>
              <button onClick={() => setShowAddAgent(!showAddAgent)} className="px-3 py-1.5 bg-primary-600 text-white rounded-lg text-sm flex items-center gap-1">
                <Plus className="w-4 h-4" /> Add Agent
              </button>
            </div>

            {showAddAgent && (
              <form onSubmit={handleAddAgent} className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                <input value={agentForm.name} onChange={(e) => setAgentForm({ ...agentForm, name: e.target.value })} placeholder="Agent Name *" required className="px-3 py-2 border rounded-lg text-sm" />
                <input value={agentForm.email} onChange={(e) => setAgentForm({ ...agentForm, email: e.target.value })} placeholder="Email *" required type="email" className="px-3 py-2 border rounded-lg text-sm" />
                <div className="flex gap-2">
                  <input value={agentForm.password} onChange={(e) => setAgentForm({ ...agentForm, password: e.target.value })} placeholder="Password *" required type="password" minLength={6} className="flex-1 px-3 py-2 border rounded-lg text-sm" />
                  <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm">Add</button>
                </div>
              </form>
            )}

            <p className="text-sm text-gray-500">Agents can view conversations and reply to messages on behalf of your business.</p>
          </div>
        )}

        <div className="bg-white rounded-xl border p-5">
          <h2 className="text-lg font-semibold mb-4">Webhook URL</h2>
          <p className="text-sm text-gray-500 mb-2">Configure this URL in your Meta WhatsApp Business API settings:</p>
          <code className="block bg-gray-100 px-4 py-2 rounded-lg text-sm text-gray-700 break-all">
            https://your-domain.com/api/webhook/whatsapp
          </code>
          <p className="text-xs text-gray-400 mt-2">Verify Token: Set in your .env as META_WEBHOOK_VERIFY_TOKEN</p>
        </div>
      </div>
    </div>
  );
}
