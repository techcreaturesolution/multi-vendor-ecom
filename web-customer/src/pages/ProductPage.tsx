import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "../lib/api";
import { useAuthStore } from "../store/auth";

interface Variant {
  sku: string;
  attributes: Record<string, string>;
  price: number;
  stock: number;
  image?: string;
}

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  images: string[];
  variants?: Variant[];
  vendorId: { businessName: string };
  categoryId: { name: string };
  averageRating: number;
  reviewCount: number;
}

export default function ProductPage() {
  const { slug } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [qty, setQty] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
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

  const variant =
    product.variants?.find((v) => v.sku === selectedVariant) || null;
  const displayPrice = variant?.price ?? product.price;
  const displayStock = variant?.stock ?? product.stock;

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
        <div className="mt-2 text-3xl font-semibold">₹{displayPrice.toLocaleString("en-IN")}</div>
        <div className="mt-1 text-sm text-gray-500">{displayStock > 0 ? `In stock: ${displayStock}` : "Out of stock"}</div>
        <p className="mt-4 text-gray-700 whitespace-pre-line">{product.description}</p>

        {product.variants && product.variants.length > 0 && (
          <div className="mt-4">
            <div className="text-sm font-medium mb-2">Variant</div>
            <div className="flex flex-wrap gap-2">
              {product.variants.map((v) => {
                const selected = v.sku === selectedVariant;
                const label = Object.entries(v.attributes || {})
                  .map(([k, val]) => `${k}: ${val}`)
                  .join(", ") || v.sku;
                return (
                  <button
                    key={v.sku}
                    onClick={() => {
                      setSelectedVariant(selected ? null : v.sku);
                      setQty(1);
                    }}
                    disabled={v.stock <= 0}
                    className={`px-3 py-1.5 rounded-md border text-sm ${
                      selected
                        ? "border-primary-500 bg-primary-50 text-primary-700"
                        : "border-gray-300 hover:border-gray-400"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {label}
                    {v.stock <= 0 && " (out)"}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-6 flex items-center gap-3">
          <input
            type="number"
            min={1}
            max={displayStock}
            value={qty}
            onChange={(e) => setQty(Number(e.target.value))}
            className="w-24 rounded-md border-gray-300"
          />
          <button
            onClick={add}
            disabled={displayStock <= 0}
            className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-md font-medium"
          >
            Add to cart
          </button>
        </div>
      </div>
    </div>
  );
}
