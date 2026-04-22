import { useEffect, useState } from "react";
import { api } from "../lib/api";

interface Stats {
  totalCustomers: number;
  totalVendors: number;
  approvedVendors: number;
  totalProducts: number;
  totalOrders: number;
  paidOrders: number;
  grossRevenue: number;
  adminCommissionEarned: number;
  totalShippingCollected: number;
  totalVendorPayable: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    api.get("/api/admin/dashboard").then((r) => setStats(r.data.data));
  }, []);

  const cards = [
    { label: "Customers", value: stats?.totalCustomers },
    { label: "Vendors (approved)", value: `${stats?.approvedVendors || 0} / ${stats?.totalVendors || 0}` },
    { label: "Products", value: stats?.totalProducts },
    { label: "Orders (paid)", value: `${stats?.paidOrders || 0} / ${stats?.totalOrders || 0}` },
    { label: "Gross revenue", value: `₹${(stats?.grossRevenue ?? 0).toLocaleString("en-IN")}` },
    {
      label: "Admin commission earned",
      value: `₹${(stats?.adminCommissionEarned ?? 0).toLocaleString("en-IN")}`,
    },
    {
      label: "Shipping collected",
      value: `₹${(stats?.totalShippingCollected ?? 0).toLocaleString("en-IN")}`,
    },
    {
      label: "Vendor payable",
      value: `₹${(stats?.totalVendorPayable ?? 0).toLocaleString("en-IN")}`,
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-lg p-5 shadow-sm">
            <div className="text-sm text-gray-500">{c.label}</div>
            <div className="mt-2 text-2xl font-semibold">{c.value ?? "—"}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
