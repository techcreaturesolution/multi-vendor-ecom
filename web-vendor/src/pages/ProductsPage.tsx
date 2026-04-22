import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../lib/api";

interface Product {
  _id: string;
  name: string;
  slug: string;
  sku: string;
  price: number;
  stock: number;
  isActive: boolean;
  categoryId: string;
}

interface Category {
  _id: string;
  name: string;
}

export default function ProductsPage() {
  const [items, setItems] = useState<Product[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    categoryId: "",
    price: 0,
    sku: "",
    stock: 0,
  });

  const load = async () => {
    const [p, c] = await Promise.all([
      api.get("/api/vendor/products?limit=100"),
      api.get("/api/customer/categories"),
    ]);
    setItems(p.data.data);
    setCats(c.data.data);
  };
  useEffect(() => {
    load();
  }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/api/vendor/products", {
        ...form,
        price: Number(form.price),
        stock: Number(form.stock),
        images: [],
      });
      toast.success("Created");
      setShowNew(false);
      setForm({ name: "", slug: "", description: "", categoryId: "", price: 0, sku: "", stock: 0 });
      load();
    } catch (err: unknown) {
      toast.error(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          "Failed"
      );
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Products</h1>
        <button
          onClick={() => setShowNew(!showNew)}
          className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm"
        >
          {showNew ? "Cancel" : "+ New product"}
        </button>
      </div>

      {showNew && (
        <form onSubmit={create} className="bg-white rounded-lg p-5 shadow-sm mb-6 grid grid-cols-3 gap-3">
          <input placeholder="Name" className="rounded-md border-gray-300"
                 value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <input placeholder="slug" className="rounded-md border-gray-300"
                 value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase() })} required />
          <input placeholder="SKU" className="rounded-md border-gray-300"
                 value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} required />
          <select className="rounded-md border-gray-300"
                  value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} required>
            <option value="">Category...</option>
            {cats.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
          <input type="number" placeholder="Price" className="rounded-md border-gray-300"
                 value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} required />
          <input type="number" placeholder="Stock" className="rounded-md border-gray-300"
                 value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} required />
          <textarea placeholder="Description" className="col-span-3 rounded-md border-gray-300"
                    value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
          <button className="col-span-3 bg-primary-600 text-white rounded-md py-2">Create</button>
        </form>
      )}

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">SKU</th>
              <th className="p-3">Price</th>
              <th className="p-3">Stock</th>
              <th className="p-3">Active</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.map((p) => (
              <tr key={p._id}>
                <td className="p-3 font-medium">{p.name}</td>
                <td className="p-3 text-gray-600">{p.sku}</td>
                <td className="p-3">₹{p.price.toLocaleString("en-IN")}</td>
                <td className="p-3">{p.stock}</td>
                <td className="p-3">
                  <span className={`text-xs px-2 py-1 rounded ${p.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"}`}>
                    {p.isActive ? "active" : "inactive"}
                  </span>
                </td>
              </tr>
            ))}
            {!items.length && <tr><td colSpan={5} className="p-8 text-center text-gray-500">No products yet</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
