import { useEffect, useState } from "react";
import { api } from "../lib/api";

interface Summary {
  pending: { count: number; gross: number; net: number };
  processing: { count: number; gross: number; net: number };
  paid: { count: number; gross: number; net: number };
}

export default function DashboardPage() {
  const [s, setS] = useState<Summary | null>(null);
  const [me, setMe] = useState<{ status: string; businessName: string } | null>(null);

  useEffect(() => {
    api.get("/api/vendor/me").then((r) => setMe(r.data.data));
    api
      .get("/api/vendor/earnings/summary")
      .then((r) => setS(r.data.data))
      .catch(() => setS(null));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
      {me && (
        <p className="text-gray-500 mb-6">
          {me.businessName} · status:{" "}
          <span
            className={`px-2 py-0.5 rounded text-xs ${
              me.status === "approved"
                ? "bg-green-100 text-green-800"
                : "bg-amber-100 text-amber-800"
            }`}
          >
            {me.status}
          </span>
        </p>
      )}
      {me?.status !== "approved" && (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-6 text-amber-900 text-sm">
          Your vendor account is <b>{me?.status}</b>. Most features are locked until the master
          admin approves your application and signs an MOU.
        </div>
      )}
      {s && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {(["pending", "processing", "paid"] as const).map((k) => (
            <div key={k} className="bg-white rounded-lg p-5 shadow-sm">
              <div className="text-sm text-gray-500 capitalize">{k}</div>
              <div className="mt-2 text-2xl font-semibold">
                ₹{s[k].net.toLocaleString("en-IN")}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {s[k].count} orders · gross ₹{s[k].gross.toLocaleString("en-IN")}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
