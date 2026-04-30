import { useEffect, useState } from "react";
import { MessageSquare, Users, Megaphone, BarChart3, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../services/api";
import type { DashboardStats } from "../types";

function StatCard({ icon: Icon, label, value, sublabel, to, color }: {
  icon: typeof MessageSquare;
  label: string;
  value: number | string;
  sublabel?: string;
  to: string;
  color: string;
}) {
  return (
    <Link to={to} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <ArrowUpRight className="w-4 h-4 text-gray-400" />
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
      {sublabel && <div className="text-xs text-gray-400 mt-1">{sublabel}</div>}
    </Link>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/analytics/dashboard")
      .then((res) => setStats(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" /></div>;
  }

  if (!stats) {
    return <div className="text-center py-20 text-gray-500">Failed to load dashboard</div>;
  }

  const usagePercent = stats.tenant.messageQuota > 0
    ? Math.round((stats.tenant.messagesUsed / stats.tenant.messageQuota) * 100)
    : 0;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">{stats.tenant.name} &middot; {stats.tenant.plan.toUpperCase()} plan</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Megaphone} label="Campaigns" value={stats.campaigns.total} sublabel={`${stats.campaigns.active} active`} to="/campaigns" color="bg-blue-500" />
        <StatCard icon={Users} label="Contacts" value={stats.contacts.total} to="/contacts" color="bg-green-500" />
        <StatCard icon={MessageSquare} label="Conversations" value={stats.conversations.total} sublabel={`${stats.conversations.unread} unread`} to="/chat" color="bg-purple-500" />
        <StatCard icon={BarChart3} label="Messages Sent" value={stats.messages.sent} sublabel={`${stats.messages.delivered} delivered`} to="/analytics" color="bg-orange-500" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-lg font-semibold mb-3">Message Quota Usage</h2>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${usagePercent > 80 ? "bg-red-500" : "bg-primary-500"}`}
                style={{ width: `${Math.min(usagePercent, 100)}%` }}
              />
            </div>
          </div>
          <span className="text-sm font-medium text-gray-600">
            {stats.tenant.messagesUsed.toLocaleString()} / {stats.tenant.messageQuota.toLocaleString()}
          </span>
        </div>
        <p className="text-xs text-gray-400 mt-2">{usagePercent}% used</p>
      </div>
    </div>
  );
}
