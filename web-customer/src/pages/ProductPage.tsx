import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "../lib/api";
import { useAuthStore } from "../store/auth";

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  images: string[];
  vendorId: { businessName: string };
  categoryId: { name: string };
  averageRating: number;
  reviewCount: number;
}

export default function ProductPage() {
  const { slug } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [qty, setQty] = useState(1);
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    api.get(`/api/customer/products/${slug}`).then((r) => setProduct(r.data.data.product));
  }, [slug]);

  const add = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (!product) return;
    try {
      await api.post("/api/customer/cart/items", { productId: product._id, quantity: qty });
      toast.success("Added to cart");
      navigate("/cart");
    } catch (err: unknown) {
      toast.error(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          "Failed"
      );
    }
  };

  if (!product) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="aspect-square bg-gray-100 rounded-lg grid place-items-center text-gray-400">
        {product.images?.[0] ? (
          <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover rounded-lg" />
        ) : (
          "No image"
        )}
      </div>
      <div>
        <div className="text-sm text-gray-500">{product.vendorId?.businessName} · {product.categoryId?.name}</div>
        <h1 className="text-2xl font-bold">{product.name}</h1>
        <div className="mt-2 text-3xl font-semibold">₹{product.price.toLocaleString("en-IN")}</div>
        <div className="mt-1 text-sm text-gray-500">{product.stock > 0 ? `In stock: ${product.stock}` : "Out of stock"}</div>
        <p className="mt-4 text-gray-700 whitespace-pre-line">{product.description}</p>

        <div className="mt-6 flex items-center gap-3">
          <input
            type="number"
            min={1}
            max={product.stock}
            value={qty}
            onChange={(e) => setQty(Number(e.target.value))}
            className="w-24 rounded-md border-gray-300"
          />
          <button
            onClick={add}
            disabled={product.stock <= 0}
            className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-md font-medium"
          >
            Add to cart
          </button>
        </div>
      </div>
    </div>
  );
}
