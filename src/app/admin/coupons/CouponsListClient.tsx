"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Calendar,
  CheckCircle2,
  Percent,
  Plus,
  PlusCircle,
  Search,
  Tag,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import { formatVND } from "@/lib/utils";

interface CouponsListClientProps {
  initialCoupons: any[];
}

export default function CouponsListClient({ initialCoupons }: CouponsListClientProps) {
  const [coupons, setCoupons] = useState<any[]>(initialCoupons);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form states
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"PERCENT" | "FIXED_AMOUNT">("PERCENT");
  const [discountValue, setDiscountValue] = useState("");
  const [maxUsage, setMaxUsage] = useState("100");
  const [minOrderValue, setMinOrderValue] = useState("0");
  const [expiresAt, setExpiresAt] = useState("");

  const filtered = coupons.filter((c) =>
    c.code.toLowerCase().includes(search.toLowerCase())
  );

  const resetForm = () => {
    setCode("");
    setDiscountType("PERCENT");
    setDiscountValue("");
    setMaxUsage("100");
    setMinOrderValue("0");
    setExpiresAt("");
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !discountValue) {
      toast.error("Vui lòng nhập mã code và giá trị giảm");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          discountType,
          discountValue,
          maxUsage,
          minOrderValue,
          expiresAt: expiresAt || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Lỗi tạo mã giảm giá");
        return;
      }

      toast.success("🎉 Tạo mã giảm giá thành công!");
      setCoupons([data.coupon, ...coupons]);
      setShowModal(false);
      resetForm();
    } catch (err) {
      toast.error("Lỗi tạo mã giảm giá");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, couponCode: string) => {
    if (!confirm(`Bạn có chắc muốn xóa mã giảm giá ${couponCode}?`)) return;

    try {
      const res = await fetch(`/api/admin/coupons?id=${id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Lỗi xóa mã");
        return;
      }

      toast.success("Đã xóa mã giảm giá");
      setCoupons(coupons.filter((c) => c.id !== id));
    } catch (err) {
      toast.error("Lỗi xóa mã");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo mã coupon..."
            className="w-full rounded-xl border border-slate-800 bg-slate-900 pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
          />
        </div>

        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-500 hover:bg-brand-400 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-glow transition-all"
        >
          <PlusCircle className="h-4 w-4" /> Thêm Mã Giảm Giá
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/80 uppercase text-[11px] font-bold text-slate-400 border-b border-slate-800">
            <tr>
              <th className="px-5 py-3.5">Mã Coupon</th>
              <th className="px-5 py-3.5">Mức giảm</th>
              <th className="px-5 py-3.5">Lượt sử dụng</th>
              <th className="px-5 py-3.5">Đơn tối thiểu</th>
              <th className="px-5 py-3.5">Hạn sử dụng</th>
              <th className="px-5 py-3.5">Trạng thái</th>
              <th className="px-5 py-3.5 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-slate-500">
                  Chưa có mã giảm giá nào. Bấm "Thêm Mã Giảm Giá" để tạo mới.
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

                    <td className="px-5 py-4 text-slate-400">
                      {c.minOrderValue > 0 ? formatVND(c.minOrderValue) : "Không giới hạn"}
                    </td>

                    <td className="px-5 py-4 text-slate-400">
                      {c.expiresAt ? (
                        <span className={isExpired ? "text-rose-400 font-semibold" : ""}>
                          {new Date(c.expiresAt).toLocaleDateString("vi-VN")}
                        </span>
                      ) : (
                        "Vô thời hạn"
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          !c.isActive || isExpired
                            ? "bg-rose-950 text-rose-400 border border-rose-800"
                            : "bg-emerald-950 text-emerald-400 border border-emerald-800"
                        }`}
                      >
                        {isExpired ? "Đã hết hạn" : c.isActive ? "Đang hoạt động" : "Vô hiệu"}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => handleDelete(c.id, c.code)}
                        className="p-1.5 rounded-lg bg-rose-950/40 text-rose-400 hover:bg-rose-900/60 transition-colors"
                        title="Xóa mã"
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

      {/* Modal Create Coupon */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Tag className="h-4 w-4 text-brand-400" /> Tạo Mã Giảm Giá Mới
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCoupon} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Mã Giảm Giá (Code)
                </label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="VD: WTL50, CHAOMUNG..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white uppercase font-mono placeholder:normal-case placeholder-slate-500 focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Loại giảm giá
                  </label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-brand-500 focus:outline-none"
                  >
                    <option value="PERCENT">Theo % Giảm</option>
                    <option value="FIXED_AMOUNT">Số tiền cố định (VNĐ)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Mức giảm {discountType === "PERCENT" ? "(%)" : "(VNĐ)"}
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
                    Số lượt dùng tối đa
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
                    Hạn dùng (Tùy chọn)
                  </label>
                  <input
                    type="date"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-700"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-brand-500 hover:bg-brand-400 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-glow disabled:opacity-50"
                >
                  {saving ? "Đang lưu..." : "Tạo Mã"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
