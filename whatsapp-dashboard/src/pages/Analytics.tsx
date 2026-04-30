import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend } from "recharts";
import api from "../services/api";
import type { DashboardStats } from "../types";

interface TrendData {
  date: string;
  direction: string;
  count: number;
}

export default function Analytics() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [trend, setTrend] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/analytics/dashboard"),
      api.get("/analytics/messages/trend?days=30"),
    ])
      .then(([dashRes, trendRes]) => {
        setStats(dashRes.data);
        setTrend(trendRes.data.trend);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" /></div>;
  }

  const messageBarData = stats
    ? [
        { name: "Sent", value: stats.messages.sent, fill: "#3b82f6" },
        { name: "Delivered", value: stats.messages.delivered, fill: "#22c55e" },
        { name: "Read", value: stats.messages.read, fill: "#a855f7" },
        { name: "Failed", value: stats.messages.failed, fill: "#ef4444" },
      ]
    : [];

  const trendMap: Record<string, { date: string; inbound: number; outbound: number }> = {};
  for (const t of trend) {
    if (!trendMap[t.date]) trendMap[t.date] = { date: t.date, inbound: 0, outbound: 0 };
    if (t.direction === "inbound") trendMap[t.date].inbound = t.count;
    else trendMap[t.date].outbound = t.count;
  }
  const trendChartData = Object.values(trendMap).sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Analytics</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border p-5">
          <h2 className="text-lg font-semibold mb-4">Message Status Breakdown</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={messageBarData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border p-5">
          <h2 className="text-lg font-semibold mb-4">Message Trend (30 days)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="outbound" stroke="#3b82f6" name="Sent" />
              <Line type="monotone" dataKey="inbound" stroke="#22c55e" name="Received" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          <div className="bg-white rounded-xl border p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.messages.sent}</div>
            <div className="text-sm text-gray-500">Total Sent</div>
          </div>
          <div className="bg-white rounded-xl border p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.messages.delivered}</div>
            <div className="text-sm text-gray-500">Delivered</div>
          </div>
          <div className="bg-white rounded-xl border p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.messages.read}</div>
            <div className="text-sm text-gray-500">Read</div>
          </div>
          <div className="bg-white rounded-xl border p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.messages.failed}</div>
            <div className="text-sm text-gray-500">Failed</div>
          </div>
        </div>
      )}
    </div>
  );
}
