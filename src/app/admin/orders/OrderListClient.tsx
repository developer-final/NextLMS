"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  CheckCircle2,
  Clock,
  Eye,
  FileImage,
  Filter,
  Search,
  XCircle,
  X,
  ExternalLink,
} from "lucide-react";
import { formatVND } from "@/lib/utils";

interface OrderListClientProps {
  initialOrders: any[];
}

export default function OrderListClient({ initialOrders }: OrderListClientProps) {
  const [orders, setOrders] = useState<any[]>(initialOrders);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProofImg, setSelectedProofImg] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    const matchStatus = filterStatus === "ALL" || order.status === filterStatus;
    const matchSearch =
      order.orderCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.user.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchSearch;
  });

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
        toast.error(data.error || "Lỗi duyệt đơn");
        return;
      }

      toast.success("🎉 Đã duyệt đơn và kích hoạt khóa học cho học viên!");
      setOrders(
        orders.map((o) => (o.id === orderId ? { ...o, status: "COMPLETED" } : o))
      );
    } catch (err) {
      toast.error("Lỗi duyệt đơn hàng");
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancel = async (orderId: string) => {
    if (!confirm("Bạn có chắc chắn muốn hủy đơn hàng này?")) return;

    setProcessingId(orderId);
    try {
      const res = await fetch("/api/admin/orders/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, action: "CANCEL" }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Lỗi hủy đơn");
        return;
      }

      toast.info("Đã hủy đơn hàng");
      setOrders(
        orders.map((o) => (o.id === orderId ? { ...o, status: "CANCELLED" } : o))
      );
    } catch (err) {
      toast.error("Lỗi hủy đơn");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Tabs */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {["ALL", "PENDING", "COMPLETED", "CANCELLED"].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                filterStatus === st
                  ? "bg-brand-500 text-slate-950 shadow-glow"
                  : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              {st === "ALL"
                ? "Tất cả"
                : st === "PENDING"
                ? "Chờ duyệt"
                : st === "COMPLETED"
                ? "Đã hoàn tất"
                : "Đã hủy"}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo mã đơn, email..."
            className="w-full rounded-xl border border-slate-800 bg-slate-900 pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/80 uppercase text-[11px] font-bold text-slate-400 border-b border-slate-800">
            <tr>
              <th className="px-5 py-3.5">Mã đơn & Ngày</th>
              <th className="px-5 py-3.5">Học viên</th>
              <th className="px-5 py-3.5">Khóa học</th>
              <th className="px-5 py-3.5">Số tiền</th>
              <th className="px-5 py-3.5">Biên lai</th>
              <th className="px-5 py-3.5">Trạng thái</th>
              <th className="px-5 py-3.5 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-slate-500">
                  Không có đơn hàng nào phù hợp với bộ lọc.
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
                        {new Date(order.createdAt).toLocaleString("vi-VN")}
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
                          <FileImage className="h-3.5 w-3.5 text-brand-400" /> Xem Bill
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-500">Chưa tải</span>
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
                          ? "Đã thanh toán"
                          : isPending
                          ? "Chờ duyệt"
                          : "Đã hủy"}
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
                            {processingId === order.id ? "Đang xử lý..." : "✓ Duyệt & Kích hoạt"}
                          </button>
                          <button
                            onClick={() => handleCancel(order.id)}
                            disabled={processingId === order.id}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400"
                            title="Hủy đơn"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-500">Hoàn tất</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal View Proof Image */}
      {selectedProofImg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="relative max-w-lg w-full rounded-3xl border border-slate-800 bg-slate-900 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <FileImage className="h-4 w-4 text-brand-400" /> Ảnh Biên lai Chuyển khoản
              </h3>
              <button
                onClick={() => setSelectedProofImg(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="overflow-hidden rounded-2xl border border-slate-800 bg-black">
              <img
                src={selectedProofImg}
                alt="Bill thanh toan"
                className="w-full max-h-[70vh] object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
