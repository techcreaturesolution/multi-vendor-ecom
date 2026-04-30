import { useEffect, useState, useCallback } from "react";
import { Plus, Trash2, Edit, ToggleLeft, ToggleRight } from "lucide-react";
import toast from "react-hot-toast";
import api from "../services/api";
import type { AutoReplyRule } from "../types";

export default function AutoReply() {
  const [rules, setRules] = useState<AutoReplyRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    name: "", triggerType: "keyword" as "keyword" | "exact" | "time", triggerValue: "",
    responseType: "text" as "text" | "template", responseContent: "", priority: "0",
  });

  const fetchRules = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/auto-reply");
      setRules(res.data.rules);
    } catch {
      toast.error("Failed to load rules");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRules(); }, [fetchRules]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/auto-reply", { ...form, priority: parseInt(form.priority) });
      toast.success("Rule created");
      setShowAdd(false);
      setForm({ name: "", triggerType: "keyword", triggerValue: "", responseType: "text", responseContent: "", priority: "0" });
      fetchRules();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error || "Failed to create rule");
    }
  };

  const toggleActive = async (rule: AutoReplyRule) => {
    try {
      await api.patch(`/auto-reply/${rule._id}`, { isActive: !rule.isActive });
      fetchRules();
    } catch {
      toast.error("Failed to update rule");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this rule?")) return;
    try {
      await api.delete(`/auto-reply/${id}`);
      toast.success("Rule deleted");
      fetchRules();
    } catch {
      toast.error("Failed to delete");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Auto Reply Rules</h1>
        <button onClick={() => setShowAdd(!showAdd)} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Rule
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="bg-white rounded-xl border p-4 mb-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Rule Name *" required className="px-3 py-2 border rounded-lg text-sm" />
            <select value={form.triggerType} onChange={(e) => setForm({ ...form, triggerType: e.target.value as "keyword" | "exact" | "time" })} className="px-3 py-2 border rounded-lg text-sm">
              <option value="keyword">Keyword Match</option>
              <option value="exact">Exact Match</option>
              <option value="time">Time-based</option>
            </select>
            <input value={form.triggerValue} onChange={(e) => setForm({ ...form, triggerValue: e.target.value })} placeholder={form.triggerType === "time" ? "HH:MM-HH:MM" : "Trigger keyword *"} required className="px-3 py-2 border rounded-lg text-sm" />
            <input value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} placeholder="Priority (0=highest)" type="number" className="px-3 py-2 border rounded-lg text-sm" />
          </div>
          <textarea value={form.responseContent} onChange={(e) => setForm({ ...form, responseContent: e.target.value })} placeholder="Auto-reply message *" required rows={3} className="w-full px-3 py-2 border rounded-lg text-sm" />
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm">Create Rule</button>
            <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 border rounded-lg text-sm">Cancel</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-center py-8 text-gray-400">Loading...</div>
      ) : rules.length === 0 ? (
        <div className="text-center py-16 text-gray-400">No auto-reply rules configured</div>
      ) : (
        <div className="space-y-3">
          {rules.map((rule) => (
            <div key={rule._id} className={`bg-white rounded-xl border p-4 ${!rule.isActive ? "opacity-60" : ""}`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{rule.name}</h3>
                    <span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs">{rule.triggerType}</span>
                    <span className="text-xs text-gray-400">Priority: {rule.priority}</span>
                  </div>
                  <p className="text-sm text-gray-500">Trigger: &quot;{rule.triggerValue}&quot;</p>
                  <p className="text-sm text-gray-600 mt-1">Reply: {rule.responseContent.substring(0, 100)}{rule.responseContent.length > 100 ? "..." : ""}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleActive(rule)} className="p-1">
                    {rule.isActive ? <ToggleRight className="w-6 h-6 text-green-500" /> : <ToggleLeft className="w-6 h-6 text-gray-400" />}
                  </button>
                  <button className="p-1 text-gray-400 hover:text-blue-500"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(rule._id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
