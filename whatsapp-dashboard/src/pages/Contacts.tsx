import { useEffect, useState, useCallback } from "react";
import { Search, Plus, Upload, Tag, Trash2, Edit } from "lucide-react";
import toast from "react-hot-toast";
import api from "../services/api";
import type { Contact } from "../types";

export default function Contacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", tags: "" });

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/contacts", { params: { page, search, limit: 20 } });
      setContacts(res.data.contacts);
      setTotal(res.data.total);
    } catch {
      toast.error("Failed to load contacts");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchContacts(); }, [fetchContacts]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/contacts", {
        ...form,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      });
      toast.success("Contact added");
      setShowAdd(false);
      setForm({ name: "", phone: "", email: "", tags: "" });
      fetchContacts();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error || "Failed to add contact");
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await api.post("/contacts/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success(`Created: ${res.data.created}, Skipped: ${res.data.skipped}`);
      fetchContacts();
    } catch {
      toast.error("Upload failed");
    }
    e.target.value = "";
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this contact?")) return;
    try {
      await api.delete(`/contacts/${id}`);
      toast.success("Contact deleted");
      fetchContacts();
    } catch {
      toast.error("Failed to delete");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Contacts</h1>
        <div className="flex gap-2">
          <label className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 cursor-pointer flex items-center gap-2">
            <Upload className="w-4 h-4" /> Upload Excel
            <input type="file" accept=".csv,.xlsx,.xls" onChange={handleUpload} className="hidden" />
          </label>
          <button onClick={() => setShowAdd(!showAdd)} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Contact
          </button>
        </div>
      </div>

      <div className="mb-4 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search contacts..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          />
        </div>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="bg-white rounded-xl border p-4 mb-4 grid grid-cols-1 sm:grid-cols-4 gap-3">
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name *" required className="px-3 py-2 border rounded-lg text-sm" />
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone *" required className="px-3 py-2 border rounded-lg text-sm" />
          <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" className="px-3 py-2 border rounded-lg text-sm" />
          <div className="flex gap-2">
            <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="Tags (comma-sep)" className="flex-1 px-3 py-2 border rounded-lg text-sm" />
            <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm">Save</button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Tags</th>
              <th className="px-4 py-3 font-medium">Source</th>
              <th className="px-4 py-3 font-medium w-20">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-400">Loading...</td></tr>
            ) : contacts.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-400">No contacts found</td></tr>
            ) : contacts.map((c) => (
              <tr key={c._id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{c.name}</td>
                <td className="px-4 py-3">{c.phone}</td>
                <td className="px-4 py-3 text-gray-500">{c.email || "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 flex-wrap">
                    {c.tags.map((tag) => (
                      <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded-full text-xs">
                        <Tag className="w-3 h-3" />{tag}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 capitalize text-gray-500">{c.source}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button className="p-1 text-gray-400 hover:text-blue-500"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(c._id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {total > 20 && (
          <div className="flex items-center justify-between px-4 py-3 border-t text-sm">
            <span className="text-gray-500">Showing {contacts.length} of {total}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="px-3 py-1 border rounded disabled:opacity-50">Prev</button>
              <button onClick={() => setPage(page + 1)} disabled={contacts.length < 20} className="px-3 py-1 border rounded disabled:opacity-50">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
