"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Copy,
  CheckCircle2,
  Share2,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  CreditCard,
  Building,
  User,
  ArrowRight,
  Sparkles,
  Link as LinkIcon,
  HelpCircle,
  X,
  ChevronRight,
  ShieldCheck,
  Award,
} from "lucide-react";
import { formatVND } from "@/lib/utils";
import { useLanguage } from "@/components/providers/LanguageProvider";

interface CourseItem {
  id: string;
  title: string;
  slug: string;
  price: number;
  salePrice: number | null;
  thumbnailUrl: string | null;
}

interface AffiliateClientProps {
  courses: CourseItem[];
}

export default function AffiliateClient({ courses }: AffiliateClientProps) {
  const { t, language } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [selectedCourseSlug, setSelectedCourseSlug] = useState("");
  const [copiedGeneral, setCopiedGeneral] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedCourse, setCopiedCourse] = useState(false);

  // Payout Modal State
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState<string>("");
  const [bankName, setBankName] = useState("");
  const [bankAccountNo, setBankAccountNo] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");
  const [submittingPayout, setSubmittingPayout] = useState(false);

  // Active Tab: commissions vs payouts
  const [activeTab, setActiveTab] = useState<"commissions" | "payouts">("commissions");

  // Fetch affiliate data
  const loadStats = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/affiliate/stats");
      if (res.ok) {
        const json = await res.json();
        setData(json);
        if (json.user) {
          if (json.user.bankName) setBankName(json.user.bankName);
          if (json.user.bankAccountNo) setBankAccountNo(json.user.bankAccountNo);
          if (json.user.bankAccountName) setBankAccountName(json.user.bankAccountName);
        }
      } else {
        toast.error(t.common.somethingWentWrong);
      }
    } catch {
      toast.error(t.common.connectionError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const referralCode = data?.user?.referralCode || "";
  const generalReferralLink = origin && referralCode ? `${origin}?ref=${referralCode}` : "";
  const selectedCourseLink =
    origin && referralCode && selectedCourseSlug
      ? `${origin}/courses/${selectedCourseSlug}?ref=${referralCode}`
      : "";

  const handleCopy = (text: string, type: "general" | "code" | "course") => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    if (type === "general") {
      setCopiedGeneral(true);
      toast.success(t.affiliate.linkCopied);
      setTimeout(() => setCopiedGeneral(false), 2000);
    } else if (type === "code") {
      setCopiedCode(true);
      toast.success(t.affiliate.codeCopied);
      setTimeout(() => setCopiedCode(false), 2000);
    } else if (type === "course") {
      setCopiedCourse(true);
      toast.success(t.affiliate.courseLinkCopied);
      setTimeout(() => setCopiedCourse(false), 2000);
    }
  };

  const handleOpenPayoutModal = () => {
    const available = data?.stats?.availableBalance || 0;
    setPayoutAmount(String(available));
    setShowPayoutModal(true);
  };

  const handleSubmitPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    const available = data?.stats?.availableBalance || 0;
    const minPayout = data?.settings?.minPayout || 200000;

    if (!available || available < minPayout) {
      toast.error(`${t.affiliate.minPayoutNotice}: ${formatVND(minPayout)}`);
      return;
    }

    if (!bankName.trim() || !bankAccountNo.trim() || !bankAccountName.trim()) {
      toast.error(t.affiliate.payoutFailed);
      return;
    }

    try {
      setSubmittingPayout(true);
      const res = await fetch("/api/affiliate/payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bankName,
          bankAccountNo,
          bankAccountName,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(t.affiliate.payoutSuccess);
        setShowPayoutModal(false);
        loadStats();
      } else {
        toast.error(json.error || t.affiliate.payoutFailed);
      }
    } catch {
      toast.error(t.common.connectionError);
    } finally {
      setSubmittingPayout(false);
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-400">
            <Clock className="h-3 w-3" />
            {t.affiliate.statusPending}
          </span>
        );
      case "APPROVED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
            <CheckCircle2 className="h-3 w-3" />
            {t.affiliate.statusApproved}
          </span>
        );
      case "PAID":
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-400">
            <ShieldCheck className="h-3 w-3" />
            {status === "COMPLETED" ? t.affiliate.statusCompleted : t.affiliate.statusPaid}
          </span>
        );
      case "PROCESSING":
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-0.5 text-xs font-semibold text-cyan-400">
            <Clock className="h-3 w-3" />
            {t.affiliate.statusProcessing}
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-0.5 text-xs font-semibold text-rose-400">
            <AlertCircle className="h-3 w-3" />
            {t.affiliate.statusRejected}
          </span>
        );
      default:
        return <span className="text-xs text-slate-400">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* 1. Header Banner */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/90 to-brand-950/40 p-8 sm:p-10 shadow-2xl backdrop-blur-xl">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-brand-500/10 blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-3.5 py-1 text-xs font-bold text-brand-400">
                <Sparkles className="h-3.5 w-3.5" />
                <span>World Trading Lab Partner Program</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                {t.affiliate.title}
              </h1>
              <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
                {t.affiliate.subtitle}
              </p>
            </div>

            {/* Current Commission Rate Badge */}
            <div className="flex-shrink-0 flex items-center gap-4 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-amber-600/5 p-5 shadow-glow-gold">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
                <Award className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-amber-300/80 uppercase tracking-wider">
                  Mức Hoa Hồng Của Bạn
                </p>
                <p className="text-3xl font-black text-amber-400">
                  {data?.user?.commissionRate || 20}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Referral Links & Code Generator Box */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 backdrop-blur-xl space-y-6 shadow-xl">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <LinkIcon className="h-5 w-5 text-brand-400" />
            <span>Công Cụ Tạo Liên Kết Tiếp Thị</span>
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Box 1: Referral Code */}
            <div className="lg:col-span-4 rounded-2xl border border-slate-800/80 bg-slate-950/60 p-5 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {t.affiliate.yourReferralCode}
              </span>
              <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3">
                <span className="text-lg font-black tracking-wider text-brand-400 font-mono">
                  {referralCode || "..."}
                </span>
                <button
                  onClick={() => handleCopy(referralCode, "code")}
                  className="flex items-center gap-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-bold text-slate-200 transition-colors"
                >
                  {copiedCode ? <CheckCircle2 className="h-4 w-4 text-brand-400" /> : <Copy className="h-4 w-4" />}
                  <span>{copiedCode ? t.common.copied : t.affiliate.copyCode}</span>
                </button>
              </div>
            </div>

            {/* Box 2: General Link */}
            <div className="lg:col-span-8 rounded-2xl border border-slate-800/80 bg-slate-950/60 p-5 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {t.affiliate.generalLink}
              </span>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5">
                <input
                  type="text"
                  readOnly
                  value={generalReferralLink}
                  className="w-full bg-transparent text-xs font-mono text-slate-300 outline-none select-all"
                />
                <button
                  onClick={() => handleCopy(generalReferralLink, "general")}
                  className="flex-shrink-0 flex items-center justify-center gap-1.5 rounded-lg bg-brand-500 hover:bg-brand-400 px-4 py-2 text-xs font-bold text-slate-950 transition-colors shadow-glow-brand"
                >
                  {copiedGeneral ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  <span>{copiedGeneral ? t.common.copied : t.affiliate.copyLink}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Box 3: Specific Course Link Generator */}
          <div className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-5 space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {t.affiliate.generateCourseLink}
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
              <div className="sm:col-span-6">
                <select
                  value={selectedCourseSlug}
                  onChange={(e) => setSelectedCourseSlug(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-xs font-medium text-slate-200 outline-none focus:border-brand-500 transition-colors"
                >
                  <option value="">{t.affiliate.selectCoursePlaceholder}</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.slug}>
                      {c.title} — {formatVND(c.salePrice || c.price)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-6 flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={selectedCourseLink || "Vui lòng chọn khóa học để tạo link"}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-3 text-xs font-mono text-slate-400 outline-none select-all"
                />
                <button
                  disabled={!selectedCourseSlug}
                  onClick={() => handleCopy(selectedCourseLink, "course")}
                  className="flex-shrink-0 flex items-center justify-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed px-4 py-3 text-xs font-bold text-slate-200 transition-colors"
                >
                  {copiedCourse ? <CheckCircle2 className="h-4 w-4 text-brand-400" /> : <Copy className="h-4 w-4" />}
                  <span>{t.common.copy}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Aggregated KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Available Balance */}
          <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-b from-slate-900 via-slate-900/90 to-emerald-950/20 p-6 shadow-xl backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                {t.affiliate.availableBalance}
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black text-white">
                {formatVND(data?.stats?.availableBalance || 0)}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Đủ điều kiện rút về ngân hàng</p>
              {Boolean(data?.stats?.processingPayoutBalance) && data!.stats!.processingPayoutBalance > 0 && (
                <p className="text-[11px] text-cyan-400 font-semibold mt-1">
                  • {formatVND(data!.stats!.processingPayoutBalance)} {t.affiliate.processingBalance.toLowerCase()}
                </p>
              )}
            </div>
            <button
              onClick={handleOpenPayoutModal}
              disabled={!data?.stats?.availableBalance || data.stats.availableBalance < (data.settings?.minPayout || 200000)}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 disabled:opacity-40 disabled:cursor-not-allowed py-2.5 text-xs font-black text-slate-950 shadow-glow-emerald transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>{t.affiliate.requestPayoutBtn}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Pending Balance */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                {t.affiliate.pendingBalance}
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
                <Clock className="h-5 w-5" />
              </div>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black text-white">
                {formatVND(data?.stats?.pendingBalance || 0)}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Giữ an toàn {data?.settings?.holdDays || 7} ngày đối soát
              </p>
            </div>
          </div>

          {/* Paid Balance */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                {t.affiliate.paidBalance}
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                <CheckCircle className="h-5 w-5" />
              </div>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black text-white">
                {formatVND(data?.stats?.paidBalance || 0)}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Đã giải ngân về tài khoản</p>
            </div>
          </div>

          {/* Total Referred Orders */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                {t.affiliate.totalOrders}
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black text-white">
                {data?.stats?.totalReferredOrders || 0}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Tổng thu nhập: {formatVND(data?.stats?.lifetimeEarnings || 0)}
              </p>
            </div>
          </div>
        </div>

        {/* 4. History Tabs: Commissions vs Payouts */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 backdrop-blur-xl space-y-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveTab("commissions")}
                className={`text-sm font-bold pb-2 transition-colors relative ${
                  activeTab === "commissions"
                    ? "text-brand-400"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {t.affiliate.commissionsHistory} ({data?.commissions?.length || 0})
                {activeTab === "commissions" && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-400 rounded-full" />
                )}
              </button>

              <button
                onClick={() => setActiveTab("payouts")}
                className={`text-sm font-bold pb-2 transition-colors relative ${
                  activeTab === "payouts"
                    ? "text-brand-400"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {t.affiliate.payoutHistory} ({data?.payoutRequests?.length || 0})
                {activeTab === "payouts" && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-400 rounded-full" />
                )}
              </button>
            </div>
          </div>

          {/* Tab 1: Commissions Table */}
          {activeTab === "commissions" && (
            <div className="overflow-x-auto">
              {data?.commissions?.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800/80 text-slate-400">
                    <Share2 className="h-6 w-6" />
                  </div>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    {t.affiliate.noCommissions}
                  </p>
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="py-3 px-4">{t.affiliate.orderCode}</th>
                      <th className="py-3 px-4">{t.affiliate.course}</th>
                      <th className="py-3 px-4">{t.affiliate.amount}</th>
                      <th className="py-3 px-4">{t.affiliate.commission}</th>
                      <th className="py-3 px-4">{t.affiliate.status}</th>
                      <th className="py-3 px-4">{t.affiliate.date}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {data?.commissions?.map((item: any) => {
                      const courseTitle =
                        item.order?.orderItems?.[0]?.course?.title || "Khóa học";
                      return (
                        <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-300">
                            {item.order?.orderCode}
                          </td>
                          <td className="py-3.5 px-4 text-white max-w-xs truncate">
                            {courseTitle}
                          </td>
                          <td className="py-3.5 px-4 text-slate-300 font-mono">
                            {formatVND(item.orderAmount)}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-brand-400 font-mono">
                            +{formatVND(item.commissionAmount)} ({Number(item.commissionRate)}%)
                          </td>
                          <td className="py-3.5 px-4">{renderStatusBadge(item.status)}</td>
                          <td className="py-3.5 px-4 text-slate-400">
                            {new Date(item.createdAt).toLocaleDateString(
                              language === "vi" ? "vi-VN" : "en-US"
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Tab 2: Payout Requests Table */}
          {activeTab === "payouts" && (
            <div className="overflow-x-auto">
              {data?.payoutRequests?.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800/80 text-slate-400">
                    <CreditCard className="h-6 w-6" />
                  </div>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    {t.affiliate.noPayouts}
                  </p>
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="py-3 px-4">Số Tiền Rút</th>
                      <th className="py-3 px-4">Tài Khoản Nhận</th>
                      <th className="py-3 px-4">Trạng Thái</th>
                      <th className="py-3 px-4">Ghi Chú Admin</th>
                      <th className="py-3 px-4">Ngày Yêu Cầu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {data?.payoutRequests?.map((p: any) => (
                      <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>

        {/* 5. How It Works Guide */}
        <div className="rounded-3xl border border-slate-800/80 bg-slate-900/40 p-8 space-y-6">
          <h2 className="text-xl font-bold text-white text-center">
            {t.affiliate.howItWorksTitle}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6 space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10 text-brand-400 font-black">
                1
              </div>
              <h3 className="text-sm font-bold text-white">{t.affiliate.step1Title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{t.affiliate.step1Desc}</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6 space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10 text-brand-400 font-black">
                2
              </div>
              <h3 className="text-sm font-bold text-white">{t.affiliate.step2Title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{t.affiliate.step2Desc}</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6 space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10 text-brand-400 font-black">
                3
              </div>
              <h3 className="text-sm font-bold text-white">{t.affiliate.step3Title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{t.affiliate.step3Desc}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Payout Request Modal */}
      {showPayoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2 text-white font-bold text-lg">
                <CreditCard className="h-5 w-5 text-brand-400" />
                <span>{t.affiliate.requestPayoutTitle}</span>
              </div>
              <button
                onClick={() => setShowPayoutModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitPayout} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-300">
                  {t.affiliate.payoutAmountLabel}
                </label>
                <input
                  type="text"
                  readOnly
                  value={formatVND(data?.stats?.availableBalance || 0)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 font-mono text-sm text-brand-400 font-bold outline-none cursor-default"
                />
                <p className="text-[11px] text-slate-400">
                  {t.affiliate.withdrawAllNotice} • {t.affiliate.minPayoutNotice}: {formatVND(data?.settings?.minPayout || 200000)}
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-300">
                  {t.affiliate.bankNameLabel}
                </label>
                <input
                  type="text"
                  placeholder="VD: Ngân hàng TMCP Ngoại thương (Vietcombank)"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-slate-200 outline-none focus:border-brand-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-300">
                  {t.affiliate.bankAccountNoLabel}
                </label>
                <input
                  type="text"
                  placeholder="VD: 1029384756"
                  value={bankAccountNo}
                  onChange={(e) => setBankAccountNo(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 font-mono text-slate-200 outline-none focus:border-brand-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-300">
                  {t.affiliate.bankAccountNameLabel}
                </label>
                <input
                  type="text"
                  placeholder="VD: NGUYEN VAN A"
                  value={bankAccountName}
                  onChange={(e) => setBankAccountName(e.target.value.toUpperCase())}
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 uppercase font-bold text-slate-200 outline-none focus:border-brand-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowPayoutModal(false)}
                  className="rounded-xl border border-slate-800 bg-slate-800/80 px-4 py-2.5 font-bold text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={submittingPayout}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 disabled:opacity-50 px-5 py-2.5 font-black text-slate-950 shadow-glow-emerald transition-all"
                >
                  {submittingPayout ? t.affiliate.submittingPayout : t.affiliate.submitPayoutBtn}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
