import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import toast from "react-hot-toast";
import api from "../services/api";
import type { Subscription } from "../types";

interface PlanInfo {
  name: string;
  messageQuota: number;
  priceMonthly: number;
}

export default function SubscriptionPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<PlanInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [changing, setChanging] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get("/subscription/current"),
      api.get("/subscription/plans"),
    ])
      .then(([subRes, planRes]) => {
        setSubscription(subRes.data);
        setPlans(planRes.data.plans);
      })
      .catch(() => toast.error("Failed to load subscription"))
      .finally(() => setLoading(false));
  }, []);

  const handleChangePlan = async (planName: string) => {
    if (planName === subscription?.plan) return;
    setChanging(true);
    try {
      const res = await api.post("/subscription/change-plan", { plan: planName });
      if (res.data.requiresPayment) {
        toast.success(`Payment required: ₹${res.data.amount}. Order ID: ${res.data.orderId}`);
      } else {
        setSubscription(res.data.subscription);
        toast.success(`Switched to ${planName} plan`);
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error || "Failed to change plan");
    } finally {
      setChanging(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" /></div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Subscription</h1>

      {subscription && (
        <div className="bg-white rounded-xl border p-5 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Current Plan: <span className="text-primary-600 capitalize">{subscription.plan}</span></h2>
              <p className="text-sm text-gray-500">
                Quota: {subscription.messageQuota.toLocaleString()} messages/month
                {subscription.priceMonthly > 0 && ` · ₹${subscription.priceMonthly}/month`}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Renews: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              subscription.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            }`}>
              {subscription.status}
            </span>
          </div>
        </div>
      )}

      <h2 className="text-lg font-semibold mb-4">Available Plans</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {plans.map((plan) => (
          <div key={plan.name} className={`bg-white rounded-xl border-2 p-5 ${subscription?.plan === plan.name ? "border-primary-500" : "border-gray-200"}`}>
            <h3 className="text-lg font-bold capitalize mb-2">{plan.name}</h3>
            <div className="text-3xl font-bold mb-1">
              {plan.priceMonthly === 0 ? "Free" : `₹${plan.priceMonthly}`}
              {plan.priceMonthly > 0 && <span className="text-sm font-normal text-gray-500">/mo</span>}
            </div>
            <p className="text-sm text-gray-500 mb-4">{plan.messageQuota.toLocaleString()} messages</p>
            <ul className="text-sm space-y-2 mb-4">
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Bulk Messaging</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Chat Inbox</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Auto-Reply</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Analytics</li>
            </ul>
            <button
              onClick={() => handleChangePlan(plan.name)}
              disabled={subscription?.plan === plan.name || changing}
              className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${
                subscription?.plan === plan.name
                  ? "bg-gray-100 text-gray-500 cursor-default"
                  : "bg-primary-600 text-white hover:bg-primary-700"
              } disabled:opacity-50`}
            >
              {subscription?.plan === plan.name ? "Current Plan" : "Switch Plan"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
