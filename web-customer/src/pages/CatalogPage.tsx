import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";

interface Product {
  _id: string;
  name: string;
  slug: string;
  price: number;
  images: string[];
  vendorId: { businessName: string };
  categoryId: { name: string };
}

interface Category {
  _id: string;
  name: string;
  slug: string;
}

export default function CatalogPage() {
  const [items, setItems] = useState<Product[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [cat, setCat] = useState("");
  const [q, setQ] = useState("");

  const load = async () => {
    const qs = new URLSearchParams();
    if (cat) qs.append("categoryId", cat);
    if (q) qs.append("q", q);
    qs.append("limit", "40");
    const r = await api.get(`/api/customer/products?${qs.toString()}`);
    setItems(r.data.data);
  };

  useEffect(() => {
    api.get("/api/customer/categories").then((r) => setCats(r.data.data));
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cat]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex gap-3 mb-6">
        <input
          placeholder="Search products"
          className="flex-1 rounded-md border-gray-300"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load()}
        />
        <select className="rounded-md border-gray-300" value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="">All categories</option>
          {cats.map((c) => (
            <option key={c._id} value={c._id}>{c.name}</option>
          ))}
        </select>
        <button onClick={load} className="bg-primary-600 hover:bg-primary-700 text-white px-4 rounded-md">
          Search
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
        {items.map((p) => (
          <Link
            key={p._id}
            to={`/p/${p.slug}`}
            className="bg-white rounded-lg border hover:shadow-md transition overflow-hidden"
          >
            <div className="aspect-square bg-gray-100 grid place-items-center text-gray-400 text-xs">
              {p.images?.[0] ? (
                <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
              ) : (
                "no image"
              )}
            </div>
            <div className="p-3">
              <div className="text-sm text-gray-500">{p.vendorId?.businessName}</div>
              <div className="font-medium text-sm truncate">{p.name}</div>
              <div className="mt-1 font-semibold">₹{p.price.toLocaleString("en-IN")}</div>
            </div>
          </Link>
        ))}
        {!items.length && (
          <div className="col-span-full text-center py-12 text-gray-500">No products found</div>
        )}
      </div>
    </div>
  );
}
