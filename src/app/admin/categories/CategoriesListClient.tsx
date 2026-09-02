"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Edit2,
  Layers,
  PlusCircle,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";

interface CategoriesListClientProps {
  initialCategories: any[];
}

export default function CategoriesListClient({ initialCategories }: CategoriesListClientProps) {
  const { t } = useLanguage();
  const [categories, setCategories] = useState<any[]>(initialCategories);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [orderIndex, setOrderIndex] = useState("0");
  const [icon, setIcon] = useState("BookOpen");

  const filtered = categories.filter((cat) =>
    cat.name.toLowerCase().includes(search.toLowerCase()) ||
    cat.slug.toLowerCase().includes(search.toLowerCase())
  );

  const openCreateModal = () => {
    setEditingCategory(null);
    setName("");
    setDescription("");
    setOrderIndex(String(categories.length + 1));
    setIcon("BookOpen");
    setShowModal(true);
  };

  const openEditModal = (cat: any) => {
    setEditingCategory(cat);
    setName(cat.name);
    setDescription(cat.description || "");
    setOrderIndex(String(cat.orderIndex || 0));
    setIcon(cat.icon || "BookOpen");
    setShowModal(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error(t.admin.categories.nameLabel);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingCategory?.id,
          name,
          description,
          orderIndex,
          icon,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Error saving category");
        return;
      }

      toast.success(data.message || "Saved successfully");

      if (editingCategory) {
        setCategories(
          categories.map((c) => (c.id === editingCategory.id ? { ...c, ...data.category } : c))
        );
      } else {
        setCategories([...categories, { ...data.category, _count: { courses: 0 } }]);
      }

      setShowModal(false);
    } catch (err) {
      toast.error("Error saving category");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, catName: string) => {
    if (!confirm(`Are you sure you want to delete "${catName}"?`)) return;

    try {
      const res = await fetch(`/api/admin/categories?id=${id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Error deleting category");
        return;
      }

      toast.success("Category deleted");
      setCategories(categories.filter((c) => c.id !== id));
    } catch (err) {
      toast.error("Error deleting category");
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-extrabold text-white">{t.admin.categories.title}</h1>
        <p className="text-xs text-slate-400 mt-1">
          {t.admin.categories.subtitle} ({categories.length})
        </p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`${t.admin.categories.nameHeader}...`}
            className="w-full rounded-xl border border-slate-800 bg-slate-900 pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
          />
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-500 hover:bg-brand-400 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-glow transition-all"
        >
          <PlusCircle className="h-4 w-4" /> {t.admin.categories.addCategoryBtn}
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/80 uppercase text-[11px] font-bold text-slate-400 border-b border-slate-800">
            <tr>
              <th className="px-5 py-3.5">#</th>
              <th className="px-5 py-3.5">{t.admin.categories.nameHeader}</th>
              <th className="px-5 py-3.5">{t.admin.categories.slugHeader}</th>
              <th className="px-5 py-3.5">{t.admin.categories.coursesCountHeader}</th>
              <th className="px-5 py-3.5">{t.admin.categories.descLabel}</th>
              <th className="px-5 py-3.5 text-right">{t.admin.categories.actionHeader}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filtered.map((cat) => (
              <tr key={cat.id} className="hover:bg-slate-800/30 transition-colors">
                <td className="px-5 py-4 font-bold text-brand-400">
                  #{cat.orderIndex}
                </td>

                <td className="px-5 py-4">
                  <span className="font-bold text-white block">{cat.name}</span>
                </td>

                <td className="px-5 py-4">
                  <span className="font-mono text-[11px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    {cat.slug}
                  </span>
                </td>

                <td className="px-5 py-4 font-semibold text-purple-400">
                  {cat._count?.courses || 0} {t.categories.coursesCount}
                </td>

                <td className="px-5 py-4 text-slate-400 max-w-xs truncate">
                  {cat.description || "—"}
                </td>

                <td className="px-5 py-4 text-right space-x-2">
                  <button
                    onClick={() => openEditModal(cat)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                    title={t.admin.categories.editBtn}
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(cat.id, cat.name)}
                    className="p-1.5 rounded-lg bg-rose-950/40 text-rose-400 hover:bg-rose-900/60 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Add / Edit Category */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="h-4 w-4 text-brand-400" />
                {editingCategory ? t.admin.categories.modalEditTitle : t.admin.categories.modalAddTitle}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {t.admin.categories.nameLabel}
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Crypto & Web3 Trading"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Order Index
                </label>
                <input
                  type="number"
                  value={orderIndex}
                  onChange={(e) => setOrderIndex(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {t.admin.categories.descLabel}
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-700"
                >
                  {t.admin.categories.cancelBtn}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-brand-500 hover:bg-brand-400 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-glow disabled:opacity-50"
                >
                  {saving ? t.admin.categories.savingBtn : t.admin.categories.saveBtn}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

