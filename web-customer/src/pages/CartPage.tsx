import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "../lib/api";
import { useAuthStore } from "../store/auth";

interface CartItem {
  productId: {
    _id: string;
    name: string;
    slug: string;
    price: number;
    images: string[];
    stock: number;
  };
  quantity: number;
}

interface Cart {
  items: CartItem[];
}

export default function CartPage() {
  const [cart, setCart] = useState<Cart | null>(null);
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  const load = async () => {
    const r = await api.get("/api/customer/cart");
    setCart(r.data.data);
  };
  useEffect(() => {
    if (user) load();
  }, [user]);

  if (!user)
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-600 mb-4">Please sign in to view your cart.</p>
        <Link to="/login" className="text-primary-600 hover:underline">
          Sign in
        </Link>
      </div>
    );

  const update = async (pid: string, qty: number) => {
    await api.patch(`/api/customer/cart/items/${pid}`, { quantity: qty });
    load();
  };
  const remove = async (pid: string) => {
    await api.delete(`/api/customer/cart/items/${pid}`);
    load();
  };

  const subtotal = cart?.items.reduce((s, i) => s + i.productId.price * i.quantity, 0) || 0;

  if (!cart) return <div className="p-8 text-center">Loading...</div>;

  if (!cart.items.length)
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-600 mb-4">Your cart is empty.</p>
        <Link to="/" className="text-primary-600 hover:underline">Browse products</Link>
      </div>
    );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Cart</h1>
      <div className="space-y-3">
        {cart.items.map((i) => (
          <div key={i.productId._id} className="flex items-center gap-4 bg-white border rounded-lg p-4">
            <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden shrink-0">
              {i.productId.images?.[0] && (
                <img src={i.productId.images[0]} className="w-full h-full object-cover" alt="" />
              )}
            </div>
            <div className="flex-1">
              <Link to={`/p/${i.productId.slug}`} className="font-medium hover:underline">
                {i.productId.name}
              </Link>
              <div className="text-sm text-gray-500">
                ₹{i.productId.price.toLocaleString("en-IN")} each
              </div>
            </div>
            <input
              type="number"
              min={0}
              max={i.productId.stock}
              value={i.quantity}
              onChange={(e) => update(i.productId._id, Number(e.target.value))}
              className="w-20 rounded-md border-gray-300"
            />
            <div className="w-24 text-right font-semibold">
              ₹{(i.productId.price * i.quantity).toLocaleString("en-IN")}
            </div>
            <button
              onClick={() => remove(i.productId._id)}
              className="text-red-600 hover:underline text-sm"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between bg-white border rounded-lg p-5">
        <div>
          <div className="text-sm text-gray-500">Subtotal</div>
          <div className="text-2xl font-semibold">₹{subtotal.toLocaleString("en-IN")}</div>
          <div className="text-xs text-gray-500">Shipping calculated at checkout</div>
        </div>
        <button
          onClick={() => {
            if (!cart.items.length) return toast.error("Cart is empty");
            navigate("/checkout");
          }}
          className="bg-primary-600 hover:bg-primary-700 text-white font-medium px-6 py-2.5 rounded-md"
        >
          Proceed to checkout
        </button>
      </div>
    </div>
  );
}
