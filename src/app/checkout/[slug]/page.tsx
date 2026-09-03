"use client";

import { useState, useEffect, use } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  CreditCard,
  GraduationCap,
  Lock,
  QrCode,
  ShieldCheck,
  Sparkles,
  Tag,
  UploadCloud,
  AlertCircle,
  Zap,
  Globe,
  Clock,
  Coins,
  ImageIcon,
} from "lucide-react";
import { formatVND } from "@/lib/utils";
import { generateVietQRUrl } from "@/lib/vietqr";
import { useLanguage } from "@/components/providers/LanguageProvider";

interface CheckoutPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default function CheckoutPage({ params }: CheckoutPageProps) {
  const { slug } = use(params);
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t, language } = useLanguage();

  const [course, setCourse] = useState<any>(null);
  const [loadingCourse, setLoadingCourse] = useState(true);

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const [createdOrder, setCreatedOrder] = useState<any>(null);
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const [proofUrl, setProofUrl] = useState("");
  const [submittingProof, setSubmittingProof] = useState(false);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [proofSubmitted, setProofSubmitted] = useState(false);
  const [isOrderCompletedRealtime, setIsOrderCompletedRealtime] = useState(false);
  const [processingStripe, setProcessingStripe] = useState(false);

  // Dynamic Site & Payment Settings
  const [siteSettings, setSiteSettings] = useState<any>({
    bankId: process.env.NEXT_PUBLIC_BANK_ID || "MB",
    bankName: "MB Bank (Ngân hàng Quân Đội)",
    bankAccountNo: process.env.NEXT_PUBLIC_BANK_ACCOUNT_NO || "0988888888",
    bankAccountName: process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME || "WORLD TRADING LAB",
    vietqrTemplate: "compact2",
    refundDays: 7,
    paymentManualEnabled: true,
    paymentVietqrAutoEnabled: true,
    paymentVietqrProvider: "PAYOS",
    paymentPaypalEnabled: true,
    paypalClientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "",
    paymentStripeEnabled: false,
    stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "",
    paymentCryptoEnabled: true,
    cryptoBep20Address: "",
    cryptoTrc20Address: "",
    usdExchangeRate: 25400,
  });

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    "VIETQR_AUTO" | "BANK_TRANSFER_MANUAL" | "PAYPAL" | "STRIPE" | "CRYPTO_MANUAL"
  >("VIETQR_AUTO");
  const [selectedCryptoNetwork, setSelectedCryptoNetwork] = useState<"BEP20" | "TRC20">("BEP20");
  const [countdownSeconds, setCountdownSeconds] = useState(15 * 60);

  // Fetch public site and payment settings
  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/settings/public");
        if (res.ok) {
          const data = await res.json();
          if (data.settings) {
            setSiteSettings(data.settings);
            if (data.settings.paymentVietqrAutoEnabled) {
              setSelectedPaymentMethod("VIETQR_AUTO");
            } else if (data.settings.paymentManualEnabled) {
              setSelectedPaymentMethod("BANK_TRANSFER_MANUAL");
            } else if (data.settings.paymentPaypalEnabled) {
              setSelectedPaymentMethod("PAYPAL");
            } else if (data.settings.paymentCryptoEnabled) {
              setSelectedPaymentMethod("CRYPTO_MANUAL");
            } else if (data.settings.paymentStripeEnabled) {
              setSelectedPaymentMethod("STRIPE");
            }
          }
        }
      } catch (e) {
        // Fallback to default
      }
    }
    loadSettings();
  }, []);

  // Countdown timer for VietQR auto (15 minutes)
  useEffect(() => {
    if (!createdOrder || selectedPaymentMethod !== "VIETQR_AUTO" || isOrderCompletedRealtime) return;
    const timer = setInterval(() => {
      setCountdownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [createdOrder, selectedPaymentMethod, isOrderCompletedRealtime]);

  // Fetch course info
  useEffect(() => {
    async function loadCourse() {
      try {
        const res = await fetch(`/api/courses/${slug}`);
        if (!res.ok) throw new Error("Course not found");
        const data = await res.json();
        setCourse(data);
      } catch (err) {
        toast.error(t.common.notFound);
      } finally {
        setLoadingCourse(false);
      }
    }
    loadCourse();
  }, [slug, t.common.notFound]);

  // Realtime Polling for order completion status
  useEffect(() => {
    if (!createdOrder?.orderCode || isOrderCompletedRealtime) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/status/${createdOrder.orderCode}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.isCompleted) {
          setIsOrderCompletedRealtime(true);
          toast.success(t.checkout.paymentConfirmedTitle);
          clearInterval(interval);
          setTimeout(() => {
            router.push(`/my-courses`);
          }, 2000);
        }
      } catch (e) {
        // Silent fail for polling
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [createdOrder?.orderCode, isOrderCompletedRealtime, router, language]);

  if (status === "loading" || loadingCourse) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-8 backdrop-blur-xl">
          <Lock className="mx-auto h-12 w-12 text-brand-400 mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">{t.checkout.requireLoginTitle}</h2>
          <p className="text-xs text-slate-400 mb-6">
            {t.checkout.requireLoginDesc}
          </p>
          <Link
            href={`/auth/login?callbackUrl=/checkout/${slug}`}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-500 hover:bg-brand-400 px-6 py-3 text-sm font-bold text-slate-950 shadow-glow"
          >
            {t.checkout.loginNowBtn} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-20 text-slate-400">
        {t.common.notFound}
      </div>
    );
  }

  // Calculate pricing
  const basePrice = course.salePrice !== null ? course.salePrice : course.price;
  let discountValue = 0;
  if (appliedCoupon) {
    if (appliedCoupon.calculatedDiscount !== undefined) {
      discountValue = appliedCoupon.calculatedDiscount;
    } else if (appliedCoupon.discountType === "PERCENT") {
      discountValue = (basePrice * appliedCoupon.discountValue) / 100;
    } else {
      discountValue = appliedCoupon.discountValue;
    }
  }
  const finalPrice = Math.max(0, basePrice - discountValue);
  const isFree = course.isFree || finalPrice === 0;

  // Handle Apply Coupon
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error(t.checkout.couponPlaceholder);
      return;
    }
    setApplyingCoupon(true);
    try {
      const res = await fetch("/api/coupons/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode, courseId: course.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || t.common.somethingWentWrong);
        return;
      }
      setAppliedCoupon(data.coupon);
      toast.success(`${t.checkout.couponAppliedSuccess} ${data.coupon.code}`);
    } catch (err) {
      toast.error(t.common.somethingWentWrong);
    } finally {
      setApplyingCoupon(false);
    }
  };

  // Handle Create Order / Free Enroll
  const handleCreateOrder = async () => {
    if (
      !isFree &&
      selectedPaymentMethod === "CRYPTO_MANUAL" &&
      !siteSettings.cryptoBep20Address &&
      !siteSettings.cryptoTrc20Address
    ) {
      toast.error(t.checkout.paypalNotConfigured);
      return;
    }

    setIsProcessingOrder(true);
    try {
      const targetMethod = isFree
        ? "FREE"
        : selectedPaymentMethod === "VIETQR_AUTO"
        ? siteSettings.paymentVietqrProvider === "SEPAY"
          ? "SEPAY"
          : "PAYOS"
        : selectedPaymentMethod;

      const res = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: course.id,
          couponCode: appliedCoupon?.code,
          paymentMethod: targetMethod,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.alreadyEnrolled) {
          toast.info(t.myCourses.pageTitle);
          router.push(`/courses/${slug}`);
          return;
        }
        toast.error(data.error || t.common.somethingWentWrong);
        return;
      }

      setCreatedOrder(data.order);

      if (data.isFreeOrder) {
        toast.success(t.checkout.paymentConfirmedTitle);
        router.push(`/my-courses`);
      } else {
        toast.success(t.checkout.confirmTransferTitle);
      }
    } catch (err) {
      toast.error(t.common.somethingWentWrong);
    } finally {
      setIsProcessingOrder(false);
    }
  };

  // Stripe Checkout Session Redirect Handler
  const handleStripePayment = async () => {
    if (!createdOrder) return;
    setProcessingStripe(true);
    try {
      const res = await fetch("/api/orders/stripe/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderCode: createdOrder.orderCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || t.checkout.stripeError);
        return;
      }
      toast.loading(t.common.loading);
      window.location.href = data.url;
    } catch (e) {
      toast.error(t.checkout.stripeError);
    } finally {
      setProcessingStripe(false);
    }
  };

  // Handle Receipt File Upload
  const handleReceiptFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingReceipt(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "receipt");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || t.checkout.receiptUploadFailed);
        return;
      }

      setProofUrl(data.url);
      toast.success(t.common.uploadSuccess);
    } catch (err) {
      toast.error(t.checkout.receiptUploadFailed);
    } finally {
      setUploadingReceipt(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success(`${t.common.copied} ${field}`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSendProof = async () => {
    if (!createdOrder) return;
    if (!proofUrl.trim()) {
      toast.error(t.checkout.proofInputPlaceholder);
      return;
    }
    setSubmittingProof(true);
    try {
      const res = await fetch("/api/orders/upload-proof", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderCode: createdOrder.orderCode,
          proofImageUrl: proofUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || t.checkout.receiptUploadFailed);
        return;
      }

      setProofSubmitted(true);
      toast.success(data.message || t.checkout.proofSubmittedSuccess);
    } catch (err) {
      toast.error(t.checkout.receiptUploadFailed);
    } finally {
      setSubmittingProof(false);
    }
  };

  // Bank Info from Dynamic Site Settings
  const bankId = siteSettings.bankId || "MB";
  const bankName = siteSettings.bankName || "MB Bank";
  const bankAccountNo = siteSettings.bankAccountNo || "0988888888";
  const bankAccountName = siteSettings.bankAccountName || "WORLD TRADING LAB";
  const transferContent = createdOrder ? createdOrder.orderCode : `EL ${course.slug.slice(0, 8)}`;

  const vietQRUrl = generateVietQRUrl({
    bankId,
    accountNo: bankAccountNo,
    accountName: bankAccountName,
    amount: finalPrice,
    description: transferContent,
    template: siteSettings.vietqrTemplate || "compact2",
  });

  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const exchangeRate = siteSettings.usdExchangeRate || 25400;
  const amountUsd = parseFloat((finalPrice / exchangeRate).toFixed(2));

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8 border-b border-slate-800 pb-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
          {t.checkout.pageTitle}
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          {t.checkout.pageSubtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Course Summary & Payment Gateway Selection */}
        <div className="lg:col-span-7 space-y-6">
          {/* Course Details Card */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl space-y-4">
            <div className="flex gap-4 items-center">
              <div className="h-16 w-24 rounded-2xl bg-slate-800 overflow-hidden flex-shrink-0 border border-slate-700/50">
                {course.thumbnailUrl ? (
                  <img
                    src={course.thumbnailUrl}
                    alt={course.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-slate-600">
                    <GraduationCap className="h-8 w-8" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <span className="inline-block rounded-full bg-brand-500/10 px-2.5 py-0.5 text-[10px] font-bold text-brand-400 uppercase tracking-wider mb-1">
                  {course.category?.name || "Trading Pro"}
                </span>
                <h2 className="text-base font-bold text-white truncate">
                  {course.title}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-bold text-brand-400">
                    {formatVND(finalPrice)}
                  </span>
                  {course.salePrice !== null && course.price > course.salePrice && (
                    <span className="text-[11px] text-slate-500 line-through">
                      {formatVND(course.price)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Coupon Application */}
            {!createdOrder && !isFree && (
              <div className="border-t border-slate-800/80 pt-4">
                <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5 text-brand-400" />
                  {t.checkout.couponTitle}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder={t.checkout.couponPlaceholder}
                    disabled={!!appliedCoupon || applyingCoupon}
                    className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none uppercase font-mono disabled:opacity-50"
                  />
                  {appliedCoupon ? (
                    <button
                      type="button"
                      onClick={() => {
                        setAppliedCoupon(null);
                        setCouponCode("");
                      }}
                      className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs font-bold text-rose-400 hover:bg-rose-500/20 transition-all"
                    >
                      {t.common.cancel}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={applyingCoupon || !couponCode.trim()}
                      className="rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2 text-xs font-bold text-white transition-all disabled:opacity-50"
                    >
                      {applyingCoupon ? t.checkout.applyingCoupon : t.checkout.applyCouponBtn}
                    </button>
                  )}
                </div>
                {appliedCoupon && (
                  <p className="mt-1.5 text-[11px] text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {t.checkout.couponAppliedSuccess} {appliedCoupon.code}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Payment Gateway Tabs (Only visible before order creation) */}
          {!createdOrder && !isFree && (
            <>
              <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  {t.checkout.proceedPaymentBtn}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* VietQR Auto (PayOS / SePay) */}
                  {siteSettings.paymentVietqrAutoEnabled && (
                    <button
                      type="button"
                      onClick={() => setSelectedPaymentMethod("VIETQR_AUTO")}
                      className={`p-3.5 rounded-xl border text-left transition-all relative ${
                        selectedPaymentMethod === "VIETQR_AUTO"
                          ? "border-emerald-500 bg-emerald-500/10 text-white shadow-glow"
                          : "border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4 text-emerald-400" />
                          <span className="text-xs font-bold text-white">VietQR Tự Động 24/7</span>
                        </div>
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-semibold flex items-center gap-1">
                          Nhanh 3s
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Quét mã VietQR chuyển khoản, tự động kích hoạt tức thì.
                      </p>
                    </button>
                  )}

                  {/* Manual Bank Transfer */}
                  {siteSettings.paymentManualEnabled && (
                    <button
                      type="button"
                      onClick={() => setSelectedPaymentMethod("BANK_TRANSFER_MANUAL")}
                      className={`p-3.5 rounded-xl border text-left transition-all ${
                        selectedPaymentMethod === "BANK_TRANSFER_MANUAL"
                          ? "border-brand-500 bg-brand-500/10 text-white shadow-glow"
                          : "border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-brand-400" />
                          <span className="text-xs font-bold text-white">CK Ngân Hàng (Thủ công)</span>
                        </div>
                        <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-semibold">
                          Duyệt thủ công
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Chuyển khoản truyền thống kèm tải ảnh biên lai.
                      </p>
                    </button>
                  )}

                  {/* PayPal */}
                  {siteSettings.paymentPaypalEnabled && (
                    <button
                      type="button"
                      onClick={() => setSelectedPaymentMethod("PAYPAL")}
                      className={`p-3.5 rounded-xl border text-left transition-all ${
                        selectedPaymentMethod === "PAYPAL"
                          ? "border-blue-500 bg-blue-500/10 text-white shadow-glow"
                          : "border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-blue-400" />
                          <span className="text-xs font-bold text-white">PayPal Quốc Tế</span>
                        </div>
                        <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded font-semibold">
                          USD (${amountUsd})
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Ví PayPal, Thẻ tín dụng/ghi nợ quốc tế (Visa, Master).
                      </p>
                    </button>
                  )}

                  {/* Stripe */}
                  {siteSettings.paymentStripeEnabled && (
                    <button
                      type="button"
                      onClick={() => setSelectedPaymentMethod("STRIPE")}
                      className={`p-3.5 rounded-xl border text-left transition-all ${
                        selectedPaymentMethod === "STRIPE"
                          ? "border-purple-500 bg-purple-500/10 text-white shadow-glow"
                          : "border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-purple-400" />
                          <span className="text-xs font-bold text-white">Thẻ Quốc Tế (Stripe)</span>
                        </div>
                        <span className="text-[10px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded font-semibold">
                          Credit Card
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Apple Pay, Google Pay và Thẻ tín dụng quốc tế an toàn.
                      </p>
                    </button>
                  )}

                  {/* Crypto USDT (BEP20 & TRC20) */}
                  {siteSettings.paymentCryptoEnabled && (
                    <button
                      type="button"
                      onClick={() => setSelectedPaymentMethod("CRYPTO_MANUAL")}
                      className={`p-3.5 rounded-xl border text-left transition-all ${
                        selectedPaymentMethod === "CRYPTO_MANUAL"
                          ? "border-amber-500 bg-amber-500/10 text-white shadow-glow"
                          : "border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <Coins className="h-4 w-4 text-amber-400" />
                          <span className="text-xs font-bold text-white">Crypto USDT</span>
                        </div>
                        <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-semibold">
                          BEP20 / TRC20
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Chuyển tiền mã hóa USDT (BNB Chain / Tron Network).
                      </p>
                    </button>
                  )}
                </div>
              </div>

              {/* Action Button: Create Order */}
              <button
                onClick={handleCreateOrder}
                disabled={isProcessingOrder}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-brand-500 hover:bg-brand-400 py-4 text-base font-bold text-slate-950 shadow-glow transition-all hover:scale-[1.01] disabled:opacity-50"
              >
                {isProcessingOrder ? (
                  t.checkout.orderInit
                ) : isFree ? (
                  <>
                    <Sparkles className="h-5 w-5" /> {t.checkout.activateFreeBtn}
                  </>
                ) : selectedPaymentMethod === "PAYPAL" ? (
                  <>
                    <Globe className="h-5 w-5" /> Thanh toán qua PayPal (${amountUsd} USD)
                  </>
                ) : selectedPaymentMethod === "STRIPE" ? (
                  <>
                    <CreditCard className="h-5 w-5" /> Thanh toán qua Thẻ Stripe ({formatVND(finalPrice)})
                  </>
                ) : selectedPaymentMethod === "CRYPTO_MANUAL" ? (
                  <>
                    <Coins className="h-5 w-5" /> Thanh toán qua Crypto ({amountUsd} USDT)
                  </>
                ) : (
                  <>
                    <CreditCard className="h-5 w-5" /> {t.checkout.proceedPaymentBtn} ({formatVND(finalPrice)})
                  </>
                )}
              </button>
            </>
          )}

          {/* ================================================================= */}
          {/* AFTER ORDER IS CREATED (PAYMENT EXECUTION SECTION) */}
          {/* ================================================================= */}
          {createdOrder && !isFree && (
            <div className="space-y-6">
              {/* Order Success Banner if completed */}
              {isOrderCompletedRealtime ? (
                <div className="rounded-3xl border border-emerald-500/50 bg-emerald-950/50 p-8 text-center space-y-4 shadow-glow">
                  <div className="mx-auto h-16 w-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <CheckCircle2 className="h-10 w-10 animate-bounce" />
                  </div>
                  <h3 className="text-xl font-bold text-white">{t.checkout.paymentConfirmedTitle}</h3>
                  <p className="text-xs text-slate-300">
                    {t.checkout.paymentConfirmedDesc}
                  </p>
                  <Link
                    href={`/my-courses`}
                    className="inline-flex items-center gap-2 rounded-xl bg-brand-500 hover:bg-brand-400 px-6 py-2.5 text-xs font-bold text-slate-950 shadow-glow"
                  >
                    {t.checkout.learnNowBtn} <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              ) : createdOrder.paymentMethod === "PAYPAL" ? (
                /* OFFICIAL PAYPAL SMART BUTTONS CARD */
                <div className="rounded-3xl border border-blue-500/30 bg-slate-900/90 p-6 space-y-6 shadow-glow">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <div>
                      <span className="text-[11px] font-bold text-blue-400 uppercase">
                        {t.checkout.orderCodeLabel} #{createdOrder.orderCode}
                      </span>
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Globe className="h-5 w-5 text-blue-400" /> Thanh Toán Quốc Tế PayPal
                      </h3>
                    </div>
                    <span className="rounded-full bg-blue-500/20 px-3 py-1 text-xs font-bold text-blue-400 border border-blue-500/30">
                      PayPal Official Checkout
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Số tiền thanh toán (USD):</span>
                      <strong className="text-white text-base">${amountUsd} USD</strong>
                    </div>
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Tỷ giá quy đổi:</span>
                      <span className="text-slate-300">1 USD = {Number(exchangeRate).toLocaleString("vi-VN")} VND</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Tương đương giá trị khóa học:</span>
                      <span className="text-slate-300">{formatVND(finalPrice)}</span>
                    </div>
                  </div>

                  {/* Official PayPal Buttons SDK */}
                  <div className="space-y-3">
                    {siteSettings.paypalClientId ? (
                      <div className="relative z-10">
                        <PayPalScriptProvider
                          options={{
                            clientId: siteSettings.paypalClientId,
                            currency: "USD",
                            intent: "capture",
                          }}
                        >
                          <PayPalButtons
                            style={{
                              layout: "vertical",
                              shape: "rect",
                              color: "gold",
                              label: "pay",
                            }}
                            createOrder={async () => {
                              const res = await fetch("/api/orders/paypal/create", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ orderCode: createdOrder.orderCode }),
                              });
                              const data = await res.json();
                              if (!res.ok) {
                                throw new Error(data.error || "Không thể tạo đơn hàng PayPal");
                              }
                              return data.paypalOrderId;
                            }}
                            onApprove={async (data) => {
                              toast.loading(t.common.loading);
                              const res = await fetch("/api/orders/paypal-capture", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  orderCode: createdOrder.orderCode,
                                  paypalOrderId: data.orderID,
                                }),
                              });
                              const result = await res.json();
                              if (!res.ok) {
                                throw new Error(result.error || t.checkout.paypalCancelled);
                              }
                              setIsOrderCompletedRealtime(true);
                              toast.success(t.checkout.paypalSuccess);
                              setTimeout(() => {
                                router.push("/my-courses");
                              }, 1500);
                            }}
                            onError={(err: any) => {
                              console.error("PayPal Smart Button Error:", err);
                              toast.error(t.checkout.paypalCancelled);
                            }}
                          />
                        </PayPalScriptProvider>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-amber-500/40 bg-amber-950/40 p-4 text-xs text-amber-200 text-center">
                        {t.checkout.paypalNotConfigured}
                      </div>
                    )}

                    <p className="text-[11px] text-center text-slate-400">
                      Hỗ trợ số dư tài khoản PayPal và các loại thẻ tín dụng / ghi nợ quốc tế (Visa, MasterCard, Amex).
                    </p>
                  </div>
                </div>
              ) : createdOrder.paymentMethod === "STRIPE" ? (
                /* OFFICIAL STRIPE CHECKOUT CARD */
                <div className="rounded-3xl border border-purple-500/30 bg-slate-900/90 p-6 space-y-6 shadow-glow">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <div>
                      <span className="text-[11px] font-bold text-purple-400 uppercase">
                        {t.checkout.orderCodeLabel} #{createdOrder.orderCode}
                      </span>
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-purple-400" /> Thanh Toán Thẻ Quốc Tế Stripe
                      </h3>
                    </div>
                    <span className="rounded-full bg-purple-500/20 px-3 py-1 text-xs font-bold text-purple-400 border border-purple-500/30">
                      Stripe Official
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Số tiền thanh toán:</span>
                      <strong className="text-white text-base">{formatVND(finalPrice)}</strong>
                    </div>
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Chuẩn bảo mật:</span>
                      <span className="text-emerald-400 font-semibold">PCI-DSS Level 1 & 3D Secure</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Phương thức hỗ trợ:</span>
                      <span className="text-slate-300">Visa, MasterCard, JCB, Apple Pay, Google Pay</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={handleStripePayment}
                      disabled={processingStripe}
                      className="w-full flex items-center justify-center gap-3 rounded-2xl bg-[#635BFF] hover:bg-[#5851EA] text-white py-4 text-base font-bold shadow-glow transition-transform hover:scale-[1.01] disabled:opacity-50"
                    >
                      {processingStripe ? (
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      ) : (
                        <>
                          <CreditCard className="h-5 w-5" />
                          <span>Thanh toán Thẻ với Stripe ({formatVND(finalPrice)})</span>
                        </>
                      )}
                    </button>
                    <p className="text-[11px] text-center text-slate-400">
                      Hệ thống sẽ chuyển tiếp bạn đến cổng thanh toán bảo mật chính thức của Stripe.
                    </p>
                  </div>
                </div>
              ) : createdOrder.paymentMethod === "BANK_TRANSFER_MANUAL" ? (
                /* MANUAL BANK TRANSFER WITH FILE UPLOAD */
                <div className="rounded-3xl border border-brand-500/30 bg-slate-900/90 p-6 space-y-6 shadow-glow">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <div>
                      <span className="text-[11px] font-bold text-brand-400 uppercase">
                        {t.checkout.orderCodeLabel} #{createdOrder.orderCode}
                      </span>
                      <h3 className="text-lg font-bold text-white">
                        {t.checkout.vietqrGuideTitle} (Duyệt Đơn Thủ Công)
                      </h3>
                    </div>
                    <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-bold text-amber-400 border border-amber-500/30">
                      {t.checkout.pendingPaymentBadge}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-6 items-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="relative rounded-2xl overflow-hidden border-2 border-brand-500/50 p-2 bg-white flex-shrink-0 shadow-lg">
                        <img
                          src={vietQRUrl}
                          alt="VietQR Payment Code"
                          className="w-48 h-auto object-contain"
                        />
                      </div>
                      <a
                        href={vietQRUrl}
                        download={`vietqr-${createdOrder.orderCode}.png`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-semibold text-brand-400 hover:underline flex items-center gap-1"
                      >
                        <QrCode className="h-3.5 w-3.5" /> {t.checkout.openSaveQr}
                      </a>
                    </div>

                    <div className="flex-1 space-y-3 w-full text-xs">
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                        <div>
                          <span className="text-slate-400 block text-[10px]">{t.checkout.beneficiaryBank}</span>
                          <strong className="text-white text-sm">{bankId} ({bankName})</strong>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                        <div>
                          <span className="text-slate-400 block text-[10px]">{t.checkout.accountNumber}</span>
                          <strong className="text-brand-400 text-sm">{bankAccountNo}</strong>
                        </div>
                        <button
                          onClick={() => copyToClipboard(bankAccountNo, t.checkout.accountNumber)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                        >
                          {copiedField === t.checkout.accountNumber ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                        <div>
                          <span className="text-slate-400 block text-[10px]">{t.checkout.accountHolder}</span>
                          <strong className="text-white">{bankAccountName}</strong>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-brand-950/40 border border-brand-500/40">
                        <div>
                          <span className="text-brand-300 block text-[10px]">{t.checkout.transferContentRequired}</span>
                          <strong className="text-brand-400 text-sm">{createdOrder.orderCode}</strong>
                        </div>
                        <button
                          onClick={() => copyToClipboard(createdOrder.orderCode, t.checkout.transferContentRequired)}
                          className="p-1.5 rounded-lg bg-brand-900 text-brand-300 hover:bg-brand-800"
                        >
                          {copiedField === t.checkout.transferContentRequired ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Upload Proof / Confirmation with File Upload */}
                  <div className="border-t border-slate-800 pt-5 space-y-3">
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <UploadCloud className="h-4 w-4 text-brand-400" /> {t.checkout.confirmTransferTitle}
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Tải lên ảnh chụp màn hình biên lai chuyển khoản hoặc dán link ảnh để ban quản trị đối soát:
                    </p>

                    {proofSubmitted ? (
                      <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/40 p-3.5 text-xs text-emerald-300 flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                        <span>{t.checkout.proofSubmittedSuccess}</span>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex flex-col sm:flex-row gap-2">
                          <label className="flex items-center justify-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2.5 text-xs font-bold text-white cursor-pointer transition-all border border-slate-700">
                            <ImageIcon className="h-4 w-4 text-brand-400" />
                            <span>{uploadingReceipt ? "Đang tải ảnh..." : "Chọn ảnh biên lai"}</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              disabled={uploadingReceipt}
                              onChange={handleReceiptFileUpload}
                            />
                          </label>

                          <input
                            type="text"
                            value={proofUrl}
                            onChange={(e) => setProofUrl(e.target.value)}
                            placeholder={t.checkout.proofInputPlaceholder}
                            className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
                          />

                          <button
                            onClick={handleSendProof}
                            disabled={submittingProof || !proofUrl.trim()}
                            className="rounded-xl bg-brand-500 hover:bg-brand-400 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-glow disabled:opacity-50 transition-all"
                          >
                            {submittingProof ? t.checkout.submittingProof : t.checkout.iHaveTransferredBtn}
                          </button>
                        </div>

                        {proofUrl && (
                          <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-950 border border-slate-800">
                            <img
                              src={proofUrl}
                              alt="Receipt Preview"
                              className="h-12 w-12 object-cover rounded-lg border border-slate-700"
                            />
                            <span className="text-[11px] text-emerald-400 font-medium truncate flex-1">
                              ✓ Đã đính kèm ảnh biên lai thành công
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : createdOrder.paymentMethod === "CRYPTO_MANUAL" ? (
                /* CRYPTO MANUAL PAYMENT CARD (BEP-20 & TRC-20) */
                <div className="rounded-3xl border border-amber-500/30 bg-slate-900/90 p-6 space-y-6 shadow-glow">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <div>
                      <span className="text-[11px] font-bold text-amber-400 uppercase">
                        {t.checkout.orderCodeLabel} #{createdOrder.orderCode}
                      </span>
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Coins className="h-5 w-5 text-amber-400" /> Thanh Toán Tiền Mã Hóa USDT
                      </h3>
                    </div>
                    <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-bold text-amber-400 border border-amber-500/30">
                      Crypto Transfer
                    </span>
                  </div>

                  {/* Network Tabs (BEP20 vs TRC20) */}
                  <div className="space-y-4">
                    <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800">
                      <button
                        type="button"
                        onClick={() => setSelectedCryptoNetwork("BEP20")}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                          selectedCryptoNetwork === "BEP20"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        <Zap className="h-3.5 w-3.5 text-emerald-400" />
                        <span>USDT (BEP-20 / BNB Chain)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedCryptoNetwork("TRC20")}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                          selectedCryptoNetwork === "TRC20"
                            ? "bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-sm"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        <Globe className="h-3.5 w-3.5 text-rose-400" />
                        <span>USDT (TRC-20 / Tron)</span>
                      </button>
                    </div>

                    {/* Dynamic Wallet Box */}
                    {(() => {
                      const currentAddress =
                        selectedCryptoNetwork === "BEP20"
                          ? siteSettings.cryptoBep20Address
                          : siteSettings.cryptoTrc20Address;
                      const currentNetworkName =
                        selectedCryptoNetwork === "BEP20"
                          ? "BNB Smart Chain (BEP20)"
                          : "Tron Network (TRC20)";
                      const feeNote =
                        selectedCryptoNetwork === "BEP20"
                          ? "Phí mạng siêu rẻ (~$0.1 - $0.3), xác nhận trong 15 giây."
                          : "Mạng lưới phổ biến trên tất cả sàn giao dịch (Binance, OKX, Bybit).";

                      if (!currentAddress) {
                        return (
                          <div className="rounded-2xl border border-rose-500/40 bg-rose-950/40 p-6 text-center space-y-3">
                            <AlertCircle className="h-10 w-10 text-rose-400 mx-auto" />
                            <h4 className="text-sm font-bold text-white">
                              Chưa cấu hình địa chỉ ví cho mạng {currentNetworkName}
                            </h4>
                            <p className="text-xs text-slate-300 max-w-md mx-auto">
                              Quản trị viên chưa nhập địa chỉ ví nhận USDT cho mạng này. Vui lòng chuyển sang tab mạng còn lại hoặc liên hệ bộ phận hỗ trợ.
                            </p>
                          </div>
                        );
                      }

                      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=10&data=${encodeURIComponent(
                        currentAddress
                      )}`;

                      return (
                        <div className="space-y-4">
                          <div className="flex flex-col sm:flex-row gap-6 items-center">
                            <div className="flex flex-col items-center gap-2">
                              <div className="relative rounded-2xl overflow-hidden border-2 border-amber-500/50 p-2 bg-white flex-shrink-0 shadow-lg">
                                <img
                                  src={qrUrl}
                                  alt="Crypto Wallet QR Code"
                                  className="w-48 h-auto object-contain"
                                />
                              </div>
                              <span className="text-[10px] text-slate-400 font-mono">Quét ví gửi USDT</span>
                            </div>

                            <div className="flex-1 space-y-3 w-full text-xs">
                              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                                <div>
                                  <span className="text-slate-400 block text-[10px]">Mạng lưới chuyển (Network)</span>
                                  <strong className="text-amber-400 text-sm">{currentNetworkName}</strong>
                                </div>
                                <span className="text-[10px] text-slate-400">{feeNote}</span>
                              </div>

                              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                                <div>
                                  <span className="text-slate-400 block text-[10px]">Số tiền USDT cần chuyển chính xác</span>
                                  <strong className="text-white text-base font-mono">{amountUsd} USDT</strong>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(String(amountUsd), "Số tiền USDT")}
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                                >
                                  {copiedField === "Số tiền USDT" ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                                </button>
                              </div>

                              <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/40">
                                <div className="min-w-0 pr-2">
                                  <span className="text-amber-300 block text-[10px]">Địa chỉ ví nhận tiền (Address)</span>
                                  <strong className="text-amber-400 text-xs font-mono break-all block">{currentAddress}</strong>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(currentAddress, "Địa chỉ ví")}
                                  className="p-1.5 rounded-lg bg-amber-900 text-amber-300 hover:bg-amber-800 flex-shrink-0"
                                >
                                  {copiedField === "Địa chỉ ví" ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-[11px] text-amber-200">
                            <strong>Lưu ý quan trọng:</strong> Vui lòng chọn chính xác mạng <strong>{currentNetworkName}</strong> trên ví/sàn của bạn để tránh thất thoát tài sản.
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Upload TXID / Proof Section with File Upload */}
                  <div className="border-t border-slate-800 pt-5 space-y-3">
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <UploadCloud className="h-4 w-4 text-amber-400" /> Xác Nhận Giao Dịch Chuyển Tiền Crypto
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Điền mã băm giao dịch (TXID / Hash) hoặc đính kèm ảnh chụp màn hình lịch sử rút tiền:
                    </p>

                    {proofSubmitted ? (
                      <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/40 p-3.5 text-xs text-emerald-300 flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                        <span>
                          Đã gửi xác nhận mã giao dịch / biên lai! Ban quản trị sẽ đối soát và kích hoạt khóa học cho bạn trong ít phút.
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex flex-col sm:flex-row gap-2">
                          <label className="flex items-center justify-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2.5 text-xs font-bold text-white cursor-pointer transition-all border border-slate-700">
                            <ImageIcon className="h-4 w-4 text-amber-400" />
                            <span>{uploadingReceipt ? "Đang tải ảnh..." : "Chọn ảnh biên lai"}</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              disabled={uploadingReceipt}
                              onChange={handleReceiptFileUpload}
                            />
                          </label>

                          <input
                            type="text"
                            value={proofUrl}
                            onChange={(e) => setProofUrl(e.target.value)}
                            placeholder="Mã TXID: 0xabc123... hoặc link ảnh chụp giao dịch"
                            className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none font-mono"
                          />

                          <button
                            onClick={handleSendProof}
                            disabled={submittingProof || !proofUrl.trim()}
                            className="rounded-xl bg-amber-500 hover:bg-amber-400 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-glow disabled:opacity-50 transition-all"
                          >
                            {submittingProof ? "Đang gửi..." : "Gửi Xác Nhận TXID"}
                          </button>
                        </div>

                        {proofUrl && (
                          <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-950 border border-slate-800">
                            <span className="text-[11px] text-amber-300 font-medium truncate flex-1">
                              ✓ Đã đính kèm: {proofUrl.slice(0, 45)}...
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* VIETQR AUTO DYNAMIC (PAYOS / SEPAY) - NO SIMULATION BUTTON */
                <div className="rounded-3xl border border-emerald-500/40 bg-slate-900/90 p-6 space-y-6 shadow-glow">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <div>
                      <span className="text-[11px] font-bold text-emerald-400 uppercase flex items-center gap-1.5">
                        <Zap className="h-3.5 w-3.5" /> VietQR Tự Động #{createdOrder.orderCode}
                      </span>
                      <h3 className="text-lg font-bold text-white">
                        Quét Mã VietQR Chuyển Khoản Nhanh 24/7
                      </h3>
                    </div>
                    {/* Countdown Timer Badge */}
                    <div className="flex items-center gap-1.5 rounded-full bg-slate-950 border border-emerald-500/30 px-3 py-1 text-xs font-mono font-bold text-emerald-400">
                      <Clock className="h-3.5 w-3.5 animate-pulse" />
                      <span>{formatCountdown(countdownSeconds)}</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-6 items-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-500/60 p-2 bg-white flex-shrink-0 shadow-xl">
                        <img
                          src={vietQRUrl}
                          alt="VietQR Auto Payment Code"
                          className="w-48 h-auto object-contain"
                        />
                      </div>
                      <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                        <Zap className="h-3.5 w-3.5" /> Tự động kích hoạt sau 3s
                      </span>
                    </div>

                    <div className="flex-1 space-y-3 w-full text-xs">
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                        <div>
                          <span className="text-slate-400 block text-[10px]">{t.checkout.beneficiaryBank}</span>
                          <strong className="text-white text-sm">{bankId} ({bankName})</strong>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                        <div>
                          <span className="text-slate-400 block text-[10px]">{t.checkout.accountNumber}</span>
                          <strong className="text-emerald-400 text-sm font-mono">{bankAccountNo}</strong>
                        </div>
                        <button
                          onClick={() => copyToClipboard(bankAccountNo, t.checkout.accountNumber)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                        >
                          {copiedField === t.checkout.accountNumber ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                        <div>
                          <span className="text-slate-400 block text-[10px]">Số tiền chính xác</span>
                          <strong className="text-white font-mono text-sm">{formatVND(finalPrice)}</strong>
                        </div>
                        <button
                          onClick={() => copyToClipboard(String(finalPrice), "Số tiền")}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                        >
                          {copiedField === "Số tiền" ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40">
                        <div>
                          <span className="text-emerald-300 block text-[10px]">Nội dung chuyển khoản (bắt buộc đúng)</span>
                          <strong className="text-emerald-400 text-sm font-mono">{createdOrder.orderCode}</strong>
                        </div>
                        <button
                          onClick={() => copyToClipboard(createdOrder.orderCode, t.checkout.transferContentRequired)}
                          className="p-1.5 rounded-lg bg-emerald-900 text-emerald-300 hover:bg-emerald-800"
                        >
                          {copiedField === t.checkout.transferContentRequired ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Automation Status */}
                  <div className="border-t border-slate-800 pt-4 flex items-center gap-2 text-xs text-slate-400">
                    <div className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>Hệ thống đang tự động lắng nghe giao dịch chuyển khoản từ ngân hàng...</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Order Summary */}
        <div className="lg:col-span-5">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 backdrop-blur-xl shadow-2xl space-y-5 sticky top-24">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 border-b border-slate-800 pb-3">
              {t.checkout.orderSummaryTitle}
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>{t.checkout.originalTuition}</span>
                <span className="text-slate-200">{formatVND(course.price)}</span>
              </div>

              {course.salePrice !== null && course.price > course.salePrice && (
                <div className="flex justify-between text-emerald-400">
                  <span>{t.checkout.courseDiscount}</span>
                  <span>-{formatVND(course.price - course.salePrice)}</span>
                </div>
              )}

              {discountValue > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>{t.checkout.couponDiscount} ({appliedCoupon?.code}):</span>
                  <span>-{formatVND(discountValue)}</span>
                </div>
              )}

              <div className="border-t border-slate-800 pt-3 flex justify-between items-baseline">
                <span className="text-sm font-bold text-white">{t.checkout.totalPayment}</span>
                <span className="text-2xl font-black text-brand-400">
                  {formatVND(finalPrice)}
                </span>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-950/60 p-4 border border-slate-800/80 space-y-2 text-[11px] text-slate-400">
              <div className="flex items-center gap-2 text-slate-300 font-semibold">
                <ShieldCheck className="h-4 w-4 text-brand-400" /> {t.checkout.qualityGuarantee}
              </div>
              <p>• {t.checkout.refundCommitment} ({siteSettings.refundDays || 7} {t.common.days}).</p>
              <p>• {t.checkout.supportCommitment}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
