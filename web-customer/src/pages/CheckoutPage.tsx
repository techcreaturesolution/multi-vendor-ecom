import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "../lib/api";
import { openRazorpayCheckout } from "../lib/razorpay";
import { useAuthStore } from "../store/auth";

interface Address {
  _id: string;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefault: boolean;
}

export default function CheckoutPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [showNew, setShowNew] = useState(false);
  const [newAddr, setNewAddr] = useState({
    fullName: "",
    phone: "",
    line1: "",
    city: "",
    state: "",
    pincode: "",
  });
  const [placing, setPlacing] = useState(false);
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  const loadAddresses = async () => {
    const r = await api.get("/api/customer/addresses");
    const list: Address[] = r.data.data;
    setAddresses(list);
    const def = list.find((a) => a.isDefault) || list[0];
    if (def) setSelected(def._id);
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  const createAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = await api.post("/api/customer/addresses", { ...newAddr, isDefault: true });
    setSelected(r.data.data._id);
    setShowNew(false);
    loadAddresses();
  };

  const placeOrder = async () => {
    if (!selected) return toast.error("Select a shipping address");
    setPlacing(true);
    try {
      const r = await api.post("/api/customer/checkout/orders", { addressId: selected });
      const { order, razorpay } = r.data.data;

      openRazorpayCheckout({
        key: razorpay.keyId,
        amount: razorpay.amount,
        currency: razorpay.currency,
        name: "MVE Shop",
        description: `Order ${order.orderNumber}`,
        order_id: razorpay.orderId,
        prefill: { name: user?.name, email: user?.email },
        theme: { color: "#2563eb" },
        handler: async (resp) => {
          try {
            await api.post("/api/customer/checkout/verify", {
              orderId: order._id,
              razorpayOrderId: resp.razorpay_order_id,
              razorpayPaymentId: resp.razorpay_payment_id,
              razorpaySignature: resp.razorpay_signature,
            });
            toast.success("Payment successful");
            navigate(`/orders/${order._id}`);
          } catch {
            toast.error("Payment verification failed");
          }
        },
      });
    } catch (err: unknown) {
      toast.error(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          "Checkout failed"
      );
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>

      <h2 className="font-medium mb-2">Shipping address</h2>
      <div className="space-y-2">
        {addresses.map((a) => (
          <label key={a._id} className="flex items-start gap-3 bg-white border rounded-lg p-4 cursor-pointer">
            <input
              type="radio"
              name="addr"
              className="mt-1"
              checked={selected === a._id}
              onChange={() => setSelected(a._id)}
            />
            <div className="text-sm">
              <div className="font-medium">{a.fullName} · {a.phone}</div>
              <div className="text-gray-600">
                {a.line1}, {a.city}, {a.state} - {a.pincode}
              </div>
            </div>
          </label>
        ))}
      </div>

      <button
        onClick={() => setShowNew(!showNew)}
        className="text-primary-600 hover:underline text-sm mt-3"
      >
        {showNew ? "Cancel" : "+ Add new address"}
      </button>

      {showNew && (
        <form onSubmit={createAddress} className="mt-3 bg-white border rounded-lg p-4 grid grid-cols-2 gap-3">
          {([
            ["fullName", "Full name"],
            ["phone", "Phone"],
            ["line1", "Address line"],
            ["city", "City"],
            ["state", "State"],
            ["pincode", "Pincode"],
          ] as const).map(([k, label]) => (
            <input
              key={k}
              placeholder={label}
              className="rounded-md border-gray-300"
              value={(newAddr as Record<string, string>)[k]}
              onChange={(e) => setNewAddr({ ...newAddr, [k]: e.target.value })}
              required
            />
          ))}
          <button className="col-span-2 bg-primary-600 text-white rounded-md py-2">Save address</button>
        </form>
      )}

      <div className="mt-8 bg-white border rounded-lg p-5 flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Shipping will be calculated and split per vendor. Payment by Razorpay.
        </p>
        <button
          onClick={placeOrder}
          disabled={placing || !selected}
          className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-medium px-6 py-2.5 rounded-md"
        >
          {placing ? "Preparing..." : "Pay with Razorpay"}
        </button>
      </div>
    </div>
  );
}
