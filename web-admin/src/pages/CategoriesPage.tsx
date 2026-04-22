import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../lib/api";

interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
}

export default function CategoriesPage() {
  const [items, setItems] = useState<Category[]>([]);
  const [form, setForm] = useState({ name: "", slug: "", description: "", sortOrder: 0 });

  const load = async () => {
    const r = await api.get("/api/admin/categories?limit=100");
    setItems(r.data.data);
  };

  useEffect(() => {
    load();
  }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/api/admin/categories", { ...form, sortOrder: Number(form.sortOrder) });
      toast.success("Category created");
      setForm({ name: "", slug: "", description: "", sortOrder: 0 });
      load();
    } catch (err: unknown) {
      toast.error(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          "Failed"
      );
    }
  };

  const toggle = async (c: Category) => {
    await api.patch(`/api/admin/categories/${c._id}`, { isActive: !c.isActive });
    load();
  };

  const remove = async (c: Category) => {
    if (!confirm(`Delete "${c.name}"?`)) return;
    try {
      await api.delete(`/api/admin/categories/${c._id}`);
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
      <h1 className="text-2xl font-bold mb-6">Categories</h1>

      <form onSubmit={create} className="bg-white rounded-lg p-5 shadow-sm mb-6 grid grid-cols-4 gap-3">
        <input
          placeholder="Name"
          className="rounded-md border-gray-300"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <input
          placeholder="slug"
          className="rounded-md border-gray-300"
          value={form.slug}
          onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase() })}
          required
        />
        <input
          placeholder="description"
          className="rounded-md border-gray-300"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <button className="bg-primary-600 hover:bg-primary-700 text-white rounded-md px-4">
          Create
        </button>
      </form>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Slug</th>
              <th className="p-3">Active</th>
              <th className="p-3 w-40"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.map((c) => (
              <tr key={c._id}>
                <td className="p-3 font-medium">{c.name}</td>
                <td className="p-3 text-gray-600">{c.slug}</td>
                <td className="p-3">
                  <button
                    onClick={() => toggle(c)}
                    className={`text-xs px-2 py-1 rounded ${
                      c.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {c.isActive ? "active" : "inactive"}
                  </button>
                </td>
                <td className="p-3 text-right">
                  <button
                    onClick={() => remove(c)}
                    className="text-red-600 hover:underline text-xs"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
