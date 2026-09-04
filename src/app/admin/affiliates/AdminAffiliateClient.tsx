"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Users,
  DollarSign,
  CreditCard,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  AlertCircle,
  Edit2,
  Check,
  X,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { formatVND } from "@/lib/utils";
import { useLanguage } from "@/components/providers/LanguageProvider";

export default function AdminAffiliateClient() {
  const { t, language } = useLanguage();

  const [activeTab, setActiveTab] = useState<"partners" | "commissions" | "payouts">("partners");

  // Partners State
  const [partners, setPartners] = useState<any[]>([]);
  const [loadingPartners, setLoadingPartners] = useState(false);
  const [partnerQuery, setPartnerQuery] = useState("");
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingRate, setEditingRate] = useState<string>("");

  // Commissions State
  const [commissions, setCommissions] = useState<any[]>([]);
  const [loadingCommissions, setLoadingCommissions] = useState(false);
  const [commissionStatus, setCommissionStatus] = useState<string>("ALL");
  const [commissionQuery, setCommissionQuery] = useState("");

  // Payouts State
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loadingPayouts, setLoadingPayouts] = useState(false);
  const [payoutStatus, setPayoutStatus] = useState<string>("ALL");

  // Payout Action Modal State
  const [selectedPayout, setSelectedPayout] = useState<any | null>(null);
  const [actionType, setActionType] = useState<"APPROVE" | "REJECT" | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [proofImageUrl, setProofImageUrl] = useState("");
  const [processingAction, setProcessingAction] = useState(false);

  // Load Partners
  const loadPartners = async () => {
    try {
      setLoadingPartners(true);
      const url = partnerQuery
        ? `/api/admin/affiliates?q=${encodeURIComponent(partnerQuery)}`
        : "/api/admin/affiliates";
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setPartners(json.affiliates || []);
      }
    } catch {
      toast.error(t.common.connectionError);
    } finally {
      setLoadingPartners(false);
    }
  };

  // Load Commissions
  const loadCommissions = async () => {
    try {
      setLoadingCommissions(true);
      const params = new URLSearchParams();
      if (commissionStatus !== "ALL") params.set("status", commissionStatus);
      if (commissionQuery.trim()) params.set("q", commissionQuery.trim());
      const res = await fetch(`/api/admin/affiliates/commissions?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setCommissions(json.commissions || []);
      }
    } catch {
      toast.error(t.common.connectionError);
    } finally {
      setLoadingCommissions(false);
    }
  };

  // Load Payouts
  const loadPayouts = async () => {
    try {
      setLoadingPayouts(true);
      const params = new URLSearchParams();
      if (payoutStatus !== "ALL") params.set("status", payoutStatus);
      const res = await fetch(`/api/admin/affiliates/payouts?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setPayouts(json.payouts || []);
      }
    } catch {
      toast.error(t.common.connectionError);
    } finally {
      setLoadingPayouts(false);
    }
  };

  useEffect(() => {
    if (activeTab === "partners") loadPartners();
    else if (activeTab === "commissions") loadCommissions();
    else if (activeTab === "payouts") loadPayouts();
  }, [activeTab, commissionStatus, payoutStatus]);

  // Handle Save Custom Commission Rate
  const handleSaveRate = async (userId: string) => {
    try {
      const res = await fetch("/api/admin/affiliates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          customCommissionRate: editingRate ? parseFloat(editingRate) : null,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(t.adminAffiliate.rateUpdated);
        setEditingUserId(null);
        loadPartners();
      } else {
        toast.error(json.error || t.common.somethingWentWrong);
      }
    } catch {
      toast.error(t.common.connectionError);
    }
  };

  // Handle Process Payout
  const handleProcessPayout = async () => {
    if (!selectedPayout || !actionType) return;

    try {
      setProcessingAction(true);
      const res = await fetch("/api/admin/affiliates/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payoutId: selectedPayout.id,
          action: actionType,
          adminNote,
          proofImageUrl,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(
          actionType === "APPROVE"
            ? t.adminAffiliate.payoutApproved
            : t.adminAffiliate.payoutRejected
        );
        setSelectedPayout(null);
        setActionType(null);
        setAdminNote("");
        setProofImageUrl("");
        loadPayouts();
      } else {
        toast.error(json.error || t.common.somethingWentWrong);
      }
    } catch {
      toast.error(t.common.connectionError);
    } finally {
      setProcessingAction(false);
    }
  };

  // Handle Process Commission (Approve early or Reject)
  const handleProcessCommission = async (commissionId: string, action: "APPROVE" | "REJECT") => {
    const confirmMessage =
      action === "APPROVE"
        ? t.adminAffiliate.confirmApproveCommission
        : t.adminAffiliate.confirmRejectCommission;

    if (!window.confirm(confirmMessage)) return;

    try {
      const res = await fetch("/api/admin/affiliates/commissions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commissionId, action }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(
          action === "APPROVE"
            ? t.adminAffiliate.commissionApproved
            : t.adminAffiliate.commissionRejected
        );
        loadCommissions();
      } else {
        toast.error(json.error || t.common.somethingWentWrong);
      }
    } catch {
      toast.error(t.common.connectionError);
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-400">
            <Clock className="h-3 w-3" />
            <span>Chờ duyệt</span>
          </span>
        );
      case "APPROVED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400">
            <CheckCircle2 className="h-3 w-3" />
            <span>Khả dụng</span>
          </span>
        );
      case "PAID":
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-blue-400">
            <ShieldCheck className="h-3 w-3" />
            <span>Đã giải ngân</span>
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-rose-400">
            <XCircle className="h-3 w-3" />
            <span>Đã từ chối</span>
          </span>
        );
      default:
        return <span className="text-xs text-slate-400">{status}</span>;
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {t.adminAffiliate.title}
            </h1>
            <span className="inline-flex items-center rounded-full bg-brand-500/10 border border-brand-500/30 px-2.5 py-0.5 text-xs font-bold text-brand-400">
              LMS Growth
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {t.adminAffiliate.subtitle}
          </p>
        </div>
      </div>

      {/* 2. Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800">
        <button
          onClick={() => setActiveTab("partners")}
          className={`flex items-center gap-2 px-5 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all ${
            activeTab === "partners"
              ? "border-brand-400 text-brand-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Users className="h-4 w-4" />
          <span>{t.adminAffiliate.tabsPartners}</span>
        </button>

        <button
          onClick={() => setActiveTab("commissions")}
          className={`flex items-center gap-2 px-5 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all ${
            activeTab === "commissions"
              ? "border-brand-400 text-brand-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <DollarSign className="h-4 w-4" />
          <span>{t.adminAffiliate.tabsCommissions}</span>
        </button>

        <button
          onClick={() => setActiveTab("payouts")}
          className={`flex items-center gap-2 px-5 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all ${
            activeTab === "payouts"
              ? "border-brand-400 text-brand-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <CreditCard className="h-4 w-4" />
          <span>{t.adminAffiliate.tabsPayouts}</span>
        </button>
      </div>

      {/* TAB 1: Partners */}
      {activeTab === "partners" && (
        <div className="space-y-4">
          {/* Search Box */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder={t.adminAffiliate.searchPlaceholder}
                value={partnerQuery}
                onChange={(e) => setPartnerQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && loadPartners()}
                className="w-full rounded-xl border border-slate-800 bg-slate-900/90 pl-10 pr-4 py-2.5 text-xs text-slate-200 outline-none focus:border-brand-500"
              />
            </div>
            <button
              onClick={loadPartners}
              className="rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-300"
            >
              Tìm kiếm
            </button>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-800 bg-slate-950/40 text-slate-400 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">{t.adminAffiliate.partnerName}</th>
                    <th className="py-3.5 px-4">{t.adminAffiliate.referralCode}</th>
                    <th className="py-3.5 px-4">{t.adminAffiliate.customRate}</th>
                    <th className="py-3.5 px-4">{t.adminAffiliate.totalOrders}</th>
                    <th className="py-3.5 px-4">{t.adminAffiliate.totalEarned}</th>
                    <th className="py-3.5 px-4">{t.adminAffiliate.totalPaid}</th>
                    <th className="py-3.5 px-4">{t.adminAffiliate.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {loadingPartners ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        {t.common.loading}
                      </td>
                    </tr>
                  ) : partners.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Chưa có đối tác tiếp thị nào
                      </td>
                    </tr>
                  ) : (
                    partners.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-white">{p.name}</p>
                          <p className="text-slate-400 text-[11px]">{p.email}</p>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-brand-400">
                          {p.referralCode || "—"}
                        </td>
                        <td className="py-3.5 px-4">
                          {editingUserId === p.id ? (
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                min={0}
                                max={100}
                                value={editingRate}
                                onChange={(e) => setEditingRate(e.target.value)}
                                placeholder="Mặc định"
                                className="w-16 rounded-lg border border-brand-500/50 bg-slate-950 px-2 py-1 text-xs text-white outline-none"
                              />
                              <button
                                onClick={() => handleSaveRate(p.id)}
                                className="rounded bg-brand-500 p-1 text-slate-950 hover:bg-brand-400"
                              >
                                <Check className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => setEditingUserId(null)}
                                className="rounded bg-slate-800 p-1 text-slate-400 hover:text-white"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : (
                            <span className="font-bold text-slate-200">
                              {p.customCommissionRate !== null
                                ? `${p.customCommissionRate}% (Riêng)`
                                : "20% (Mặc định)"}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-200 font-mono">
                          {p.totalReferredOrders}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-emerald-400 font-mono">
                          {formatVND(p.totalEarned)}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-blue-400 font-mono">
                          {formatVND(p.totalPaid)}
                        </td>
                        <td className="py-3.5 px-4">
                          <button
                            onClick={() => {
                              setEditingUserId(p.id);
                              setEditingRate(
                                p.customCommissionRate !== null ? String(p.customCommissionRate) : ""
                              );
                            }}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 px-2.5 py-1 text-[11px] font-bold text-slate-200 transition-colors"
                          >
                            <Edit2 className="h-3 w-3" />
                            <span>{t.adminAffiliate.editRate}</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Commissions */}
      {activeTab === "commissions" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Tìm mã đơn, email hoặc tên đối tác..."
                value={commissionQuery}
                onChange={(e) => setCommissionQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && loadCommissions()}
                className="w-full rounded-xl border border-slate-800 bg-slate-900/90 pl-10 pr-4 py-2.5 text-xs text-slate-200 outline-none focus:border-brand-500"
              />
            </div>

            <select
              value={commissionStatus}
              onChange={(e) => setCommissionStatus(e.target.value)}
              className="rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-xs font-bold text-slate-200 outline-none focus:border-brand-500"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="PENDING">Chờ đối soát (PENDING)</option>
              <option value="APPROVED">Đủ điều kiện rút (APPROVED)</option>
              <option value="PAID">Đã thanh toán (PAID)</option>
              <option value="REJECTED">Bị hủy (REJECTED)</option>
            </select>

            <button
              onClick={loadCommissions}
              className="rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-300"
            >
              Lọc
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-800 bg-slate-950/40 text-slate-400 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Mã Đơn</th>
                    <th className="py-3.5 px-4">Khóa Học</th>
                    <th className="py-3.5 px-4">Đối Tác</th>
                    <th className="py-3.5 px-4">Giá Trị Đơn</th>
                    <th className="py-3.5 px-4">Hoa Hồng</th>
                    <th className="py-3.5 px-4">Trạng Thái</th>
                    <th className="py-3.5 px-4">Ngày Tạo</th>
                    <th className="py-3.5 px-4">{t.adminAffiliate.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {loadingCommissions ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        {t.common.loading}
                      </td>
                    </tr>
                  ) : commissions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        Không tìm thấy khoản hoa hồng nào
                      </td>
                    </tr>
                  ) : (
                    commissions.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-300">
                          {c.order?.orderCode}
                        </td>
                        <td className="py-3.5 px-4 text-white max-w-xs truncate">
                          {c.order?.orderItems?.[0]?.course?.title || "Khóa học"}
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-white">{c.affiliate?.name}</p>
                          <p className="font-mono text-slate-400 text-[11px]">
                            {c.affiliate?.referralCode}
                          </p>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-300">
                          {formatVND(c.orderAmount)}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-brand-400">
                          +{formatVND(c.commissionAmount)} ({Number(c.commissionRate)}%)
                        </td>
                        <td className="py-3.5 px-4">{renderStatusBadge(c.status)}</td>
                        <td className="py-3.5 px-4 text-slate-400">
                          {new Date(c.createdAt).toLocaleDateString(
                            language === "vi" ? "vi-VN" : "en-US"
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          {c.status === "PENDING" ? (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleProcessCommission(c.id, "APPROVE")}
                                className="rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 px-2.5 py-1 text-[11px] font-bold text-emerald-400 transition-colors"
                              >
                                {t.adminAffiliate.approveCommission}
                              </button>
                              <button
                                onClick={() => handleProcessCommission(c.id, "REJECT")}
                                className="rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 px-2.5 py-1 text-[11px] font-bold text-rose-400 transition-colors"
                              >
                                {t.adminAffiliate.rejectCommission}
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-600 font-mono">—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Payouts */}
      {activeTab === "payouts" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <select
              value={payoutStatus}
              onChange={(e) => setPayoutStatus(e.target.value)}
              className="rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-xs font-bold text-slate-200 outline-none focus:border-brand-500"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="PENDING">Chờ duyệt (PENDING)</option>
              <option value="COMPLETED">Đã giải ngân (COMPLETED)</option>
              <option value="REJECTED">Từ chối (REJECTED)</option>
            </select>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-800 bg-slate-950/40 text-slate-400 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Đối Tác</th>
                    <th className="py-3.5 px-4">Số Tiền Rút</th>
                    <th className="py-3.5 px-4">Tài Khoản Nhận</th>
                    <th className="py-3.5 px-4">Trạng Thái</th>
                    <th className="py-3.5 px-4">Ghi Chú Admin</th>
                    <th className="py-3.5 px-4">Ngày Yêu Cầu</th>
                    <th className="py-3.5 px-4">Hành Động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {loadingPayouts ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        {t.common.loading}
                      </td>
                    </tr>
                  ) : payouts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Chưa có yêu cầu rút tiền nào
                      </td>
                    </tr>
                  ) : (
                    payouts.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-white">{p.user?.name}</p>
                          <p className="text-slate-400 text-[11px]">{p.user?.email}</p>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-emerald-400 font-mono text-sm">
                          {formatVND(p.amount)}
                        </td>
                        <td className="py-3.5 px-4 text-slate-300">
                          <p className="font-bold text-white">{p.bankName}</p>
                          <p className="font-mono text-slate-400">{p.bankAccountNo} • {p.bankAccountName}</p>
                        </td>
                        <td className="py-3.5 px-4">{renderStatusBadge(p.status)}</td>
                        <td className="py-3.5 px-4 text-slate-400">
                          {p.adminNote || "—"}
                          {p.proofImageUrl && (
                            <a
                              href={p.proofImageUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="ml-2 text-brand-400 underline font-semibold"
                            >
                              Xem bill
                            </a>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-400">
                          {new Date(p.createdAt).toLocaleDateString(
                            language === "vi" ? "vi-VN" : "en-US"
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          {p.status === "PENDING" && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setSelectedPayout(p);
                                  setActionType("APPROVE");
                                  setAdminNote("");
                                  setProofImageUrl("");
                                }}
                                className="rounded-lg bg-emerald-500 hover:bg-emerald-400 px-3 py-1.5 text-[11px] font-bold text-slate-950 transition-colors shadow-glow-emerald"
                              >
                                Duyệt chi
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedPayout(p);
                                  setActionType("REJECT");
                                  setAdminNote("");
                                }}
                                className="rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 px-3 py-1.5 text-[11px] font-bold text-rose-400 transition-colors"
                              >
                                Từ chối
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Payout Approval / Rejection Modal */}
      {selectedPayout && actionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2 text-white font-bold text-base">
                {actionType === "APPROVE" ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    <span>Duyệt Giải Ngân Hoa Hồng</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-rose-400" />
                    <span>Từ Chối Yêu Cầu Rút Tiền</span>
                  </>
                )}
              </div>
              <button
                onClick={() => {
                  setSelectedPayout(null);
                  setActionType(null);
                }}
                className="rounded-lg p-1.5 text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Payout Details Summary */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Đối tác:</span>
                <span className="font-bold text-white">{selectedPayout.user?.name} ({selectedPayout.user?.email})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Số tiền:</span>
                <span className="font-bold text-emerald-400 font-mono text-sm">{formatVND(selectedPayout.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Tài khoản nhận:</span>
                <span className="font-bold text-white">{selectedPayout.bankName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Số TK & Tên:</span>
                <span className="font-mono text-brand-400">{selectedPayout.bankAccountNo} • {selectedPayout.bankAccountName}</span>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-300">
                  {actionType === "APPROVE" ? "Ghi chú duyệt / Mã giao dịch ngân hàng:" : "Lý do từ chối (Gửi cho học viên):"}
                </label>
                <input
                  type="text"
                  placeholder={actionType === "APPROVE" ? "VD: FT240958102948 - Chuyển khoản hoàn tất" : "VD: Số tài khoản không hợp lệ, vui lòng cập nhật lại"}
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-slate-200 outline-none focus:border-brand-500"
                />
              </div>

              {actionType === "APPROVE" && (
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300">
                    Đường dẫn ảnh hóa đơn chuyển tiền (Tùy chọn):
                  </label>
                  <input
                    type="url"
                    placeholder="https://storage.../receipt.jpg"
                    value={proofImageUrl}
                    onChange={(e) => setProofImageUrl(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 font-mono text-slate-200 outline-none focus:border-brand-500"
                  />
                </div>
              )}

              <p className="text-[11px] text-slate-400 leading-relaxed">
                {actionType === "APPROVE"
                  ? t.adminAffiliate.confirmApprove
                  : t.adminAffiliate.confirmReject}
              </p>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPayout(null);
                    setActionType(null);
                  }}
                  className="rounded-xl border border-slate-800 bg-slate-800/80 px-4 py-2.5 font-bold text-slate-300 hover:bg-slate-700"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="button"
                  onClick={handleProcessPayout}
                  disabled={processingAction}
                  className={`flex items-center gap-2 rounded-xl px-5 py-2.5 font-black text-slate-950 transition-all ${
                    actionType === "APPROVE"
                      ? "bg-emerald-500 hover:bg-emerald-400 shadow-glow-emerald"
                      : "bg-rose-500 hover:bg-rose-400 shadow-glow-red"
                  }`}
                >
                  {processingAction ? t.common.loading : actionType === "APPROVE" ? "Xác Nhận Giải Ngân" : "Xác Nhận Từ Chối"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
