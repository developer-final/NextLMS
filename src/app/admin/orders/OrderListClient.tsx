"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import {
  CheckCircle2,
  Clock,
  Eye,
  FileImage,
  Search,
  XCircle,
  X,
  ExternalLink,
} from "lucide-react";
import { formatVND } from "@/lib/utils";
import { isValidSafeUrl } from "@/lib/validation";
import { useLanguage } from "@/components/providers/LanguageProvider";
import Pagination from "@/components/ui/Pagination";

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
}

interface OrderListClientProps {
  initialOrders: any[];
  currentSearch?: string;
  currentStatus?: string;
  pagination: PaginationInfo;
}

export default function OrderListClient({
  initialOrders,
  currentSearch = "",
  currentStatus = "ALL",
  pagination,
}: OrderListClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { t, language } = useLanguage();

  const [orders, setOrders] = useState<any[]>(initialOrders);
  const [filterStatus, setFilterStatus] = useState<string>(currentStatus);
  const [searchQuery, setSearchQuery] = useState(currentSearch);
  const [selectedProofImg, setSelectedProofImg] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    setOrders(initialOrders);
  }, [initialOrders]);

  useEffect(() => {
    setSearchQuery(currentSearch);
  }, [currentSearch]);

  useEffect(() => {
    setFilterStatus(currentStatus);
  }, [currentStatus]);

  const buildUrl = (pageNumber: number, statusVal?: string, searchVal?: string) => {
    const params = new URLSearchParams();
    const s = statusVal !== undefined ? statusVal : filterStatus;
    const q = searchVal !== undefined ? searchVal : searchQuery;
    if (s && s !== "ALL") params.set("status", s);
    if (q && q.trim()) params.set("q", q.trim());
    if (pageNumber > 1) params.set("page", pageNumber.toString());
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(buildUrl(1, filterStatus, searchQuery));
  };

  const handleStatusChange = (newStatus: string) => {
    setFilterStatus(newStatus);
    router.push(buildUrl(1, newStatus, searchQuery));
  };

  const filteredOrders = orders;

  const handleApprove = async (orderId: string) => {
    setProcessingId(orderId);
    try {
      const res = await fetch("/api/admin/orders/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, action: "APPROVE" }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || t.admin.orders.approveFailed);
        return;
      }

      toast.success(`🎉 ${t.admin.orders.approveSuccess}`);
      setOrders(
        orders.map((o) => (o.id === orderId ? { ...o, status: "COMPLETED" } : o))
      );
      router.refresh();
    } catch (err) {
      toast.error(t.admin.orders.approveFailed);
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancel = async (orderId: string) => {
    if (!confirm(t.admin.orders.cancelConfirm)) return;

    setProcessingId(orderId);
    try {
      const res = await fetch("/api/admin/orders/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, action: "CANCEL" }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || t.admin.orders.cancelFailed);
        return;
      }

      toast.info(t.admin.orders.cancelSuccess);
      setOrders(
        orders.map((o) => (o.id === orderId ? { ...o, status: "CANCELLED" } : o))
      );
      router.refresh();
    } catch (err) {
      toast.error(t.admin.orders.cancelFailed);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-extrabold text-white">{t.admin.orders.title}</h1>
        <p className="text-xs text-slate-400 mt-1">
          {t.admin.orders.subtitle} ({pagination.totalItems})
        </p>
      </div>

      {/* Search and Tabs */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {[
            { key: "ALL", label: t.admin.orders.allFilter },
            { key: "PENDING", label: t.admin.orders.pendingFilter },
            { key: "COMPLETED", label: t.admin.orders.completedFilter },
            { key: "CANCELLED", label: t.admin.orders.cancelledFilter },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleStatusChange(tab.key)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                filterStatus === tab.key
                  ? "bg-brand-500 text-slate-950 shadow-glow"
                  : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.admin.orders.searchPlaceholder}
            className="w-full rounded-xl border border-slate-800 bg-slate-900 pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
          />
        </form>
      </div>

      {/* Orders Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/80 uppercase text-[11px] font-bold text-slate-400 border-b border-slate-800">
            <tr>
              <th className="px-5 py-3.5">{t.admin.orders.orderCodeHeader}</th>
              <th className="px-5 py-3.5">{t.admin.orders.studentHeader}</th>
              <th className="px-5 py-3.5">{t.admin.courses.courseHeader}</th>
              <th className="px-5 py-3.5">{t.admin.orders.amountHeader}</th>
              <th className="px-5 py-3.5">{t.admin.orders.viewProofBtn}</th>
              <th className="px-5 py-3.5">{t.admin.orders.statusHeader}</th>
              <th className="px-5 py-3.5 text-right">{t.admin.orders.actionHeader}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-slate-500">
                  {t.admin.orders.noOrders}
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => {
                const isPending = order.status === "PENDING";
                const isCompleted = order.status === "COMPLETED";

                return (
                  <tr key={order.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-4 font-bold text-white">
                      <div>#{order.orderCode}</div>
                      <div className="text-[10px] text-slate-500 font-normal">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="font-semibold text-white">{order.user.name}</div>
                      <div className="text-[10px] text-slate-400">{order.user.email}</div>
                    </td>

                    <td className="px-5 py-4">
                      {order.orderItems?.map((item: any) => (
                        <span key={item.id} className="block text-slate-300 font-medium max-w-xs truncate">
                          {item.course?.title}
                        </span>
                      ))}
                    </td>

                    <td className="px-5 py-4 font-bold text-brand-400">
                      {formatVND(order.finalAmount)}
                    </td>

                    <td className="px-5 py-4">
                      {order.proofImageUrl ? (
                        <button
                          onClick={() => setSelectedProofImg(order.proofImageUrl)}
                          className="flex items-center gap-1 rounded-lg bg-slate-800 hover:bg-slate-700 px-2.5 py-1 text-[11px] font-semibold text-slate-200 border border-slate-700"
                        >
                          <FileImage className="h-3.5 w-3.5 text-brand-400" /> {t.admin.orders.viewProofBtn}
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-500">-</span>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isCompleted
                            ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                            : isPending
                            ? "bg-amber-950 text-amber-400 border border-amber-800"
                            : "bg-rose-950 text-rose-400 border border-rose-800"
                        }`}
                      >
                        {isCompleted
                          ? t.admin.orders.completedFilter
                          : isPending
                          ? t.admin.orders.pendingFilter
                          : t.admin.orders.cancelledFilter}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right">
                      {isPending ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleApprove(order.id)}
                            disabled={processingId === order.id}
                            className="rounded-lg bg-emerald-500 hover:bg-emerald-400 px-3 py-1.5 text-xs font-bold text-slate-950 shadow-glow disabled:opacity-50 transition-all"
                          >
                            {processingId === order.id ? "..." : `✓ ${t.admin.orders.approveBtn}`}
                          </button>
                          <button
                            onClick={() => handleCancel(order.id)}
                            disabled={processingId === order.id}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400"
                            title={t.admin.orders.cancelBtn}
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-500">✓</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Reusable Server Pagination */}
      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        totalItems={pagination.totalItems}
        pageSize={pagination.pageSize}
        buildPageUrl={(page) => buildUrl(page)}
      />

      {/* Modal View Proof Image */}
      {selectedProofImg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="relative max-w-xl w-full rounded-3xl border border-slate-800 bg-slate-900 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <FileImage className="h-4 w-4 text-brand-400" /> {t.admin.orders.proofModalTitle}
              </h3>
              <div className="flex items-center gap-2">
                {isValidSafeUrl(selectedProofImg) && (
                  <a
                    href={selectedProofImg}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-brand-400 hover:bg-slate-800 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
                <button
                  onClick={() => setSelectedProofImg(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-800 bg-black flex items-center justify-center min-h-[250px]">
              {isValidSafeUrl(selectedProofImg) ? (
                <img
                  src={selectedProofImg}
                  alt="Bill payment proof"
                  className="w-full max-h-[65vh] object-contain rounded-xl"
                />
              ) : (
                <div className="p-8 text-center text-xs text-rose-400">
                  ⚠️ Hình ảnh biên lai chứa liên kết không an toàn hoặc không hợp lệ.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

