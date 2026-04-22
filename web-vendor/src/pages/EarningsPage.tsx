import { useEffect, useState } from "react";
import { api } from "../lib/api";

interface Summary {
  grossSales: number;
  totalShipping: number;
  totalCommission: number;
  netEarnings: number;
  pendingPayout: number;
  paidOut: number;
}

interface Payout {
  _id: string;
  periodStart: string;
  periodEnd: string;
  netPayable: number;
  status: string;
  utrNumber?: string;
  paidAt?: string;
  createdAt: string;
}

export default function EarningsPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [payouts, setPayouts] = useState<Payout[]>([]);

  useEffect(() => {
    Promise.all([
      api.get("/api/vendor/earnings/summary"),
      api.get("/api/vendor/earnings/payouts?limit=100"),
    ]).then(([s, p]) => {
      setSummary(s.data.data);
      setPayouts(p.data.data);
    });
  }, []);

  const statusColor = (s: string) =>
    s === "paid"
      ? "bg-green-100 text-green-800"
      : s === "processing"
      ? "bg-blue-100 text-blue-800"
      : s === "failed"
      ? "bg-red-100 text-red-800"
      : "bg-amber-100 text-amber-800";

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Earnings & Payouts</h1>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Stat label="Gross sales" value={summary.grossSales} />
          <Stat label="Shipping" value={summary.totalShipping} />
          <Stat label="Admin commission" value={summary.totalCommission} />
          <Stat label="Net earnings" value={summary.netEarnings} accent />
          <Stat label="Pending payout" value={summary.pendingPayout} />
          <Stat label="Paid out" value={summary.paidOut} />
        </div>
      )}

      <h2 className="text-lg font-semibold mb-3">Payout history</h2>
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="p-3">Period</th>
              <th className="p-3">Net payable</th>
              <th className="p-3">Status</th>
              <th className="p-3">UTR</th>
              <th className="p-3">Paid at</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {payouts.map((p) => (
              <tr key={p._id}>
                <td className="p-3">
                  {new Date(p.periodStart).toLocaleDateString()} →{" "}
                  {new Date(p.periodEnd).toLocaleDateString()}
                </td>
                <td className="p-3 font-medium">
                  ₹{p.netPayable.toLocaleString("en-IN")}
                </td>
                <td className="p-3">
                  <span className={`text-xs px-2 py-1 rounded ${statusColor(p.status)}`}>
                    {p.status}
                  </span>
                </td>
                <td className="p-3 text-gray-600">{p.utrNumber || "-"}</td>
                <td className="p-3 text-gray-600">
                  {p.paidAt ? new Date(p.paidAt).toLocaleDateString() : "-"}
                </td>
              </tr>
            ))}
            {!payouts.length && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500">
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

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div
      className={`rounded-lg p-4 shadow-sm ${
        accent ? "bg-primary-600 text-white" : "bg-white"
      }`}
    >
      <div className={`text-xs ${accent ? "text-primary-100" : "text-gray-500"}`}>{label}</div>
      <div className="text-2xl font-bold mt-1">₹{value.toLocaleString("en-IN")}</div>
    </div>
  );
}
