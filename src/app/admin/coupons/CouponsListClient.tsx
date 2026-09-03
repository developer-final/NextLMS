"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Edit2,
  PlusCircle,
  Search,
  Tag,
  Trash2,
  X,
  AlertTriangle,
} from "lucide-react";
import { formatVND } from "@/lib/utils";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { validateCouponInput } from "@/lib/validation";

interface CouponsListClientProps {
  initialCoupons: any[];
}

export default function CouponsListClient({ initialCoupons }: CouponsListClientProps) {
  const { t, language } = useLanguage();
  const [coupons, setCoupons] = useState<any[]>(initialCoupons);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  // Form states
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"PERCENT" | "FIXED_AMOUNT">("PERCENT");
  const [discountValue, setDiscountValue] = useState("");
  const [maxUsage, setMaxUsage] = useState("100");
  const [minOrderValue, setMinOrderValue] = useState("0");
  const [expiresAt, setExpiresAt] = useState("");
  const [isActive, setIsActive] = useState(true);

  const filtered = coupons.filter((c) =>
    c.code.toLowerCase().includes(search.toLowerCase())
  );

  const openCreateModal = () => {
    setEditingCoupon(null);
    setCode("");
    setDiscountType("PERCENT");
    setDiscountValue("");
    setMaxUsage("100");
    setMinOrderValue("0");
    setExpiresAt("");
    setIsActive(true);
    setShowModal(true);
  };

  const openEditModal = (coupon: any) => {
    setEditingCoupon(coupon);
    setCode(coupon.code);
    setDiscountType(coupon.discountType || "PERCENT");
    setDiscountValue(String(coupon.discountValue || ""));
    setMaxUsage(String(coupon.maxUsage || 100));
    setMinOrderValue(String(coupon.minOrderValue || 0));
    setExpiresAt(
      coupon.expiresAt ? new Date(coupon.expiresAt).toISOString().split("T")[0] : ""
    );
    setIsActive(coupon.isActive !== undefined ? Boolean(coupon.isActive) : true);
    setShowModal(true);
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validateCouponInput({
      code,
      discountType,
      discountValue,
      maxUsage,
      minOrderValue,
    });
    if (!validation.isValid) {
      toast.error(
        validation.error?.includes("100%")
          ? t.admin.coupons.discountInvalid
          : validation.error?.includes("trống")
          ? t.admin.coupons.codeRequired
          : (t.common.somethingWentWrong || validation.error)
      );
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingCoupon?.id,
          code,
          discountType,
          discountValue,
          maxUsage,
          minOrderValue,
          expiresAt: expiresAt || null,
          isActive,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || t.admin.coupons.saveFailed);
        return;
      }

      toast.success(
        editingCoupon
          ? t.admin.coupons.updateSuccess
          : `🎉 ${t.admin.coupons.createSuccess}`
      );

      if (editingCoupon) {
        setCoupons(
          coupons.map((c) => (c.id === editingCoupon.id ? { ...c, ...data.coupon } : c))
        );
      } else {
        setCoupons([data.coupon, ...coupons]);
      }

      setShowModal(false);
    } catch (err) {
      toast.error(t.admin.coupons.saveFailed);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, couponCode: string) => {
    if (!confirm(`${t.admin.coupons.deleteConfirm} (${couponCode})`)) return;

    try {
      const res = await fetch(`/api/admin/coupons?id=${id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || t.admin.coupons.deleteFailed);
        return;
      }

      toast.success(t.admin.coupons.deleteSuccess);
      setCoupons(coupons.filter((c) => c.id !== id));
    } catch (err) {
      toast.error(t.admin.coupons.deleteFailed);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-extrabold text-white">{t.admin.coupons.title}</h1>
        <p className="text-xs text-slate-400 mt-1">
          {t.admin.coupons.subtitle} ({coupons.length})
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
            placeholder={`${t.admin.coupons.codeHeader}...`}
            className="w-full rounded-xl border border-slate-800 bg-slate-900 pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
          />
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-500 hover:bg-brand-400 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-glow transition-all"
        >
          <PlusCircle className="h-4 w-4" /> {t.admin.coupons.addCouponBtn}
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/80 uppercase text-[11px] font-bold text-slate-400 border-b border-slate-800">
            <tr>
              <th className="px-5 py-3.5">{t.admin.coupons.codeHeader}</th>
              <th className="px-5 py-3.5">{t.admin.coupons.valueHeader}</th>
              <th className="px-5 py-3.5">{t.admin.coupons.usageHeader}</th>
              <th className="px-5 py-3.5">{t.admin.coupons.statusHeader}</th>
              <th className="px-5 py-3.5 text-right">{t.admin.coupons.actionHeader}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-slate-500">
                  -
                </td>
              </tr>
            ) : (
              filtered.map((c) => {
                const isExpired = c.expiresAt && new Date(c.expiresAt) < new Date();

                return (
                  <tr key={c.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-4">
                      <span className="font-mono font-bold text-white bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                        {c.code}
                      </span>
                    </td>

                    <td className="px-5 py-4 font-bold text-brand-400">
                      {c.discountType === "PERCENT"
                        ? `-${c.discountValue}%`
                        : `-${formatVND(c.discountValue)}`}
                    </td>

                    <td className="px-5 py-4 text-slate-300">
                      <span className="font-semibold text-white">{c.usedCount}</span> / {c.maxUsage}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          !c.isActive || isExpired
                            ? "bg-rose-950 text-rose-400 border border-rose-800"
                            : "bg-emerald-950 text-emerald-400 border border-emerald-800"
                        }`}
                      >
                        {isExpired
                          ? t.admin.coupons.inactive
                          : c.isActive
                          ? t.admin.coupons.active
                          : t.admin.coupons.inactive}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right space-x-1.5">
                      <button
                        onClick={() => openEditModal(c)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                        title={t.admin.coupons.editBtn}
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(c.id, c.code)}
                        className="p-1.5 rounded-lg bg-rose-950/40 text-rose-400 hover:bg-rose-900/60 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Add / Edit Coupon */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Tag className="h-4 w-4 text-brand-400" />
                {editingCoupon ? t.admin.coupons.modalEditTitle : t.admin.coupons.modalAddTitle}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCoupon} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {t.admin.coupons.codeLabel}
                </label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. DISCOUNT50"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white uppercase font-mono placeholder:normal-case placeholder-slate-500 focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {t.admin.coupons.typeLabel}
                  </label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as "PERCENT" | "FIXED_AMOUNT")}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-brand-500 focus:outline-none"
                  >
                    <option value="PERCENT">{t.admin.coupons.percentType}</option>
                    <option value="FIXED_AMOUNT">{t.admin.coupons.fixedType}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {t.admin.coupons.valueLabel}
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    placeholder={discountType === "PERCENT" ? "50" : "200000"}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {t.admin.coupons.maxUsesLabel}
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={maxUsage}
                    onChange={(e) => setMaxUsage(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-brand-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {t.admin.coupons.minOrderLabel}
                  </label>
                  <input
                    type="number"
                    value={minOrderValue}
                    onChange={(e) => setMinOrderValue(e.target.value)}
                    placeholder="0"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {t.admin.coupons.expiresAtLabel}
                </label>
                <input
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded border-slate-700 text-brand-500 h-4 w-4 bg-slate-950"
                  />
                  <span>{t.admin.coupons.activeCheckbox}</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-700"
                >
                  {t.admin.coupons.cancelBtn}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-brand-500 hover:bg-brand-400 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-glow disabled:opacity-50"
                >
                  {saving ? t.admin.coupons.savingBtn : t.admin.coupons.saveBtn}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
