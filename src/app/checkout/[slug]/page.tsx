"use client";

import { useState, useEffect, use } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
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
  const [proofSubmitted, setProofSubmitted] = useState(false);
  const [isOrderCompletedRealtime, setIsOrderCompletedRealtime] = useState(false);

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
    paymentStripeEnabled: false,
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
  const [processingPaypal, setProcessingPaypal] = useState(false);
  const [simulatingWebhook, setSimulatingWebhook] = useState(false);

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
        toast.error(language === "en" ? "Course information not found" : "Không tìm thấy thông tin khóa học");
      } finally {
        setLoadingCourse(false);
      }
    }
    loadCourse();
  }, [slug, language]);

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
          toast.success(language === "en" ? "🎉 Order verified successfully! Redirecting to course..." : "🎉 Đơn hàng đã được xác nhận thành công! Đang chuyển đến khóa học...");
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
        {language === "en" ? "Course not found or has been unpublished." : "Khóa học không tồn tại hoặc đã bị gỡ."}
      </div>
    );
  }

  // Calculate pricing
  const basePrice = course.salePrice !== null ? course.salePrice : course.price;
  let discountValue = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discountType === "PERCENT") {
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
      toast.error(language === "en" ? "Please enter a coupon code" : "Vui lòng nhập mã giảm giá");
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
        toast.error(data.error || (language === "en" ? "Invalid coupon code" : "Mã giảm giá không hợp lệ"));
        return;
      }
      setAppliedCoupon(data.coupon);
      toast.success(language === "en" ? `Coupon ${data.coupon.code} applied!` : `Đã áp dụng mã giảm giá ${data.coupon.code}!`);
    } catch (err) {
      toast.error(language === "en" ? "Error applying coupon" : "Lỗi áp dụng mã giảm giá");
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
      toast.error(
        language === "en"
          ? "Crypto wallet address is not configured yet. Please select another payment method or contact support."
          : "Chưa có địa chỉ ví nhận Crypto. Vui lòng chọn phương thức khác hoặc liên hệ bộ phận hỗ trợ."
      );
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
          toast.info(language === "en" ? "You already own this course!" : "Bạn đã sở hữu khóa học này rồi!");
          router.push(`/courses/${slug}`);
          return;
        }
        toast.error(data.error || (language === "en" ? "Error creating order" : "Lỗi tạo đơn hàng"));
        return;
      }

      setCreatedOrder(data.order);

      if (data.isFreeOrder) {
        toast.success(language === "en" ? "Course activated successfully!" : "Kích hoạt khóa học thành công!");
        router.push(`/my-courses`);
      } else {
        toast.success(language === "en" ? "Order created! Please scan QR code to pay." : "Đơn hàng đã được tạo! Vui lòng quét mã QR thanh toán.");
      }
    } catch (err) {
      toast.error(language === "en" ? "Error occurred while creating order" : "Đã xảy ra lỗi khi tạo đơn hàng");
    } finally {
      setIsProcessingOrder(false);
    }
  };

  // PayPal Payment Handler
  const handlePaypalPayment = async () => {
    if (!createdOrder) return;
    setProcessingPaypal(true);
    try {
      const exchangeRate = siteSettings.usdExchangeRate || 25400;
      const amountUsd = parseFloat((finalPrice / exchangeRate).toFixed(2));
      const res = await fetch("/api/orders/paypal-capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderCode: createdOrder.orderCode,
          paypalCaptureId: `PAYPAL-TX-${Date.now()}`,
          amountUsd,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Lỗi thanh toán PayPal");
        return;
      }
      toast.success(language === "en" ? "🎉 PayPal payment confirmed!" : "🎉 Thanh toán PayPal thành công!");
      setIsOrderCompletedRealtime(true);
      setTimeout(() => {
        router.push("/my-courses");
      }, 1500);
    } catch (e) {
      toast.error("Lỗi kết nối PayPal");
    } finally {
      setProcessingPaypal(false);
    }
  };

  // Webhook Test Simulation (Sandbox Helper for Admin/Tester)
  const handleSimulatePayment = async () => {
    if (!createdOrder) return;
    setSimulatingWebhook(true);
    try {
      const isSepay = siteSettings.paymentVietqrProvider === "SEPAY";
      const endpoint = isSepay ? "/api/webhook/sepay" : "/api/webhook/payos";

      const payload = isSepay
        ? {
            id: Date.now(),
            transferType: "in",
            transferAmount: finalPrice,
            content: `${createdOrder.orderCode} thanh toan`,
            gateway: "MBBank",
          }
        : {
            code: "00",
            desc: "success",
            data: {
              orderCode: createdOrder.orderCode,
              amount: finalPrice,
              description: createdOrder.orderCode,
            },
          };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Simulation error");
        return;
      }
      toast.success(language === "en" ? "⚡ Payment simulated successfully!" : "⚡ Giả lập thanh toán thành công!");
      setIsOrderCompletedRealtime(true);
      setTimeout(() => {
        router.push("/my-courses");
      }, 1500);
    } catch (err) {
      toast.error("Error simulating payment");
    } finally {
      setSimulatingWebhook(false);
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
    setSubmittingProof(true);
    try {
      const res = await fetch("/api/orders/upload-proof", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderCode: createdOrder.orderCode,
          proofImageUrl: proofUrl || "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || (language === "en" ? "Error submitting proof" : "Lỗi gửi biên lai"));
        return;
      }

      setProofSubmitted(true);
      toast.success(data.message || (language === "en" ? "Receipt confirmation submitted!" : "Đã gửi xác nhận biên lai!"));
    } catch (err) {
      toast.error(language === "en" ? "Error submitting proof" : "Lỗi gửi biên lai");
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Course Details & Checkout Form */}
        <div className="lg:col-span-7 space-y-6">
          {/* Selected Course Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 flex gap-4 items-center">
            <img
              src={
                course.thumbnailUrl ||
                "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=300&q=80"
              }
              alt={course.title}
              className="h-20 w-32 object-cover rounded-xl border border-slate-800 flex-shrink-0"
            />
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-brand-400 uppercase">
                {course.category?.name || t.checkout.courseInfoLabel}
              </span>
              <h3 className="text-sm sm:text-base font-bold text-white line-clamp-2">
                {course.title}
              </h3>
              <p className="text-xs text-slate-400">
                {t.checkout.instructorLabel} <strong className="text-slate-300">{course.instructor?.name}</strong>
              </p>
            </div>
          </div>

          {/* If Order is NOT yet created */}
          {!createdOrder && (
            <>
              {/* Coupon Form */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-1.5">
                  <Tag className="h-4 w-4 text-brand-400" /> {t.checkout.couponTitle}
                </h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder={t.checkout.couponPlaceholder}
                    className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white uppercase placeholder:normal-case placeholder-slate-500 focus:border-brand-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={applyingCoupon || !couponCode}
                    className="rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2 text-xs font-semibold text-white transition-colors disabled:opacity-50"
                  >
                    {applyingCoupon ? t.checkout.applyingCoupon : t.checkout.applyCouponBtn}
                  </button>
                </div>
                {appliedCoupon && (
                  <p className="mt-2 text-xs text-emerald-400 flex items-center gap-1">
                    <Check className="h-3.5 w-3.5" /> {t.checkout.couponAppliedSuccess} {appliedCoupon.code} (-
                    {formatVND(discountValue)})
                  </p>
                )}
              </div>

              {/* Payment Methods Selection */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <CreditCard className="h-4 w-4 text-brand-400" />
                  {language === "en" ? "Select Payment Method" : "Chọn Phương Thức Thanh Toán"}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* VietQR Auto */}
                  {siteSettings.paymentVietqrAutoEnabled && (
                    <button
                      type="button"
                      onClick={() => setSelectedPaymentMethod("VIETQR_AUTO")}
                      className={`p-3.5 rounded-xl border text-left transition-all ${
                        selectedPaymentMethod === "VIETQR_AUTO"
                          ? "border-emerald-500 bg-emerald-500/10 text-white shadow-glow"
                          : "border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4 text-emerald-400" />
                          <span className="text-xs font-bold text-white">VietQR Tự Động</span>
                        </div>
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-semibold">
                          Tự động 3s
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {language === "en" ? "Instant scan & auto enroll" : "Quét mã chuyển khoản, vào học tức thì 24/7"}
                      </p>
                    </button>
                  )}

                  {/* Manual Transfer */}
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
                          <QrCode className="h-4 w-4 text-brand-400" />
                          <span className="text-xs font-bold text-white">CK Ngân Hàng</span>
                        </div>
                        <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-semibold">
                          Duyệt tay
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {language === "en" ? "Manual transfer with receipt upload" : "Chuyển khoản thường và gửi ảnh biên lai"}
                      </p>
                    </button>
                  )}

                  {/* PayPal (Default International) */}
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
                          <span className="text-xs font-bold text-white">PayPal / Visa / Master</span>
                        </div>
                        <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded font-semibold">
                          Quốc tế
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {language === "en" ? "PayPal wallet or international cards" : "Ví PayPal, Thẻ tín dụng/ghi nợ quốc tế"}
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
                          <span className="text-xs font-bold text-white">Thẻ Stripe</span>
                        </div>
                        <span className="text-[10px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded font-semibold">
                          Credit Card
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {language === "en" ? "Direct credit/debit card" : "Thanh toán thẻ tín dụng trực tiếp"}
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
                        {language === "en" ? "Tether USDT (BNB Chain / Tron)" : "Chuyển tiền mã hóa USDT (BNB Chain / Tron)"}
                      </p>
                    </button>
                  )}
                </div>
              </div>

              {/* Action Button */}
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
                    <Globe className="h-5 w-5" /> {language === "en" ? `Pay with PayPal ($${amountUsd} USD)` : `Thanh toán qua PayPal ($${amountUsd} USD)`}
                  </>
                ) : selectedPaymentMethod === "CRYPTO_MANUAL" ? (
                  <>
                    <Coins className="h-5 w-5" /> {language === "en" ? `Pay with Crypto (${amountUsd} USDT)` : `Thanh toán qua Crypto (${amountUsd} USDT)`}
                  </>
                ) : (
                  <>
                    <CreditCard className="h-5 w-5" /> {t.checkout.proceedPaymentBtn} ({formatVND(finalPrice)})
                  </>
                )}
              </button>
            </>
          )}

          {/* If Order IS CREATED */}
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
                /* PAYPAL PAYMENT CARD */
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
                      PayPal Checkout
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>{language === "en" ? "Amount in USD:" : "Số tiền thanh toán (USD):"}</span>
                      <strong className="text-white text-base">${amountUsd} USD</strong>
                    </div>
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>{language === "en" ? "Exchange Rate:" : "Tỷ giá quy đổi:"}</span>
                      <span className="text-slate-300">1 USD = {Number(exchangeRate).toLocaleString("vi-VN")} VND</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>{language === "en" ? "Equivalent VND:" : "Tương đương giá trị khóa học:"}</span>
                      <span className="text-slate-300">{formatVND(finalPrice)}</span>
                    </div>
                  </div>

                  {/* PayPal Yellow Checkout Button */}
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={handlePaypalPayment}
                      disabled={processingPaypal}
                      className="w-full flex items-center justify-center gap-3 rounded-2xl bg-[#FFC439] hover:bg-[#F2BA36] text-[#003087] py-3.5 text-sm font-extrabold shadow-lg transition-transform hover:scale-[1.01] disabled:opacity-50"
                    >
                      {processingPaypal ? (
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#003087] border-t-transparent" />
                      ) : (
                        <>
                          <span className="italic font-black text-lg text-[#003087]">Pay</span>
                          <span className="italic font-black text-lg text-[#0079C1]">Pal</span>
                          <span className="font-bold text-slate-900 ml-1">Thanh toán ${amountUsd} USD</span>
                        </>
                      )}
                    </button>

                    <p className="text-[11px] text-center text-slate-400">
                      {language === "en"
                        ? "Supports PayPal Balance, Visa, MasterCard, American Express."
                        : "Hỗ trợ số dư tài khoản PayPal và các loại thẻ tín dụng / ghi nợ quốc tế."}
                    </p>
                  </div>
                </div>
              ) : createdOrder.paymentMethod === "BANK_TRANSFER_MANUAL" ? (
                /* MANUAL BANK TRANSFER WITH PROOF UPLOAD */
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

                  {/* Upload Proof / Confirmation */}
                  <div className="border-t border-slate-800 pt-5 space-y-3">
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <UploadCloud className="h-4 w-4 text-brand-400" /> {t.checkout.confirmTransferTitle}
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      {t.checkout.confirmTransferDesc}
                    </p>

                    {proofSubmitted ? (
                      <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/40 p-3.5 text-xs text-emerald-300 flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                        <span>
                          {t.checkout.proofSubmittedSuccess}
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          value={proofUrl}
                          onChange={(e) => setProofUrl(e.target.value)}
                          placeholder={t.checkout.proofInputPlaceholder}
                          className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
                        />
                        <button
                          onClick={handleSendProof}
                          disabled={submittingProof}
                          className="rounded-xl bg-brand-500 hover:bg-brand-400 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-glow disabled:opacity-50 transition-all"
                        >
                          {submittingProof ? t.checkout.submittingProof : t.checkout.iHaveTransferredBtn}
                        </button>
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

                    {/* Dynamic Wallet Box or Empty Warning */}
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
                              Quản trị viên chưa nhập địa chỉ ví nhận USDT cho mạng này. Vui lòng chuyển sang tab mạng còn lại hoặc liên hệ bộ phận hỗ trợ (Hotline/Zalo/Telegram) để được cấp địa chỉ ví chuyển tiền trực tiếp.
                            </p>
                          </div>
                        );
                      }

                      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=10&data=${encodeURIComponent(currentAddress)}`;

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
                            <strong>Lưu ý quan trọng:</strong> Vui lòng chọn chính xác mạng <strong>{currentNetworkName}</strong> trên ví/sàn của bạn để tránh thất thoát tài sản. Sau khi chuyển, hãy nhập mã TXID vào ô bên dưới.
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Upload TXID / Proof Section */}
                  <div className="border-t border-slate-800 pt-5 space-y-3">
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <UploadCloud className="h-4 w-4 text-amber-400" /> Xác Nhận Giao Dịch Chuyển Tiền Crypto
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Điền mã băm giao dịch (TxHash / TXID từ ví Binance, OKX, TrustWallet, MetaMask) hoặc dán link ảnh biên lai:
                    </p>

                    {proofSubmitted ? (
                      <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/40 p-3.5 text-xs text-emerald-300 flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                        <span>
                          Đã gửi xác nhận mã giao dịch / biên lai! Ban quản trị sẽ đối soát và kích hoạt khóa học cho bạn trong ít phút.
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          value={proofUrl}
                          onChange={(e) => setProofUrl(e.target.value)}
                          placeholder="Ví dụ: 0xabc123... hoặc dán link ảnh chụp giao dịch"
                          className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none font-mono"
                        />
                        <button
                          onClick={handleSendProof}
                          disabled={submittingProof}
                          className="rounded-xl bg-amber-500 hover:bg-amber-400 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-glow disabled:opacity-50 transition-all"
                        >
                          {submittingProof ? "Đang gửi..." : "Gửi Xác Nhận TXID"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* VIETQR AUTO DYNAMIC (PAYOS / SEPAY) */
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

                  {/* Automation Status & Sandbox Test Helper */}
                  <div className="border-t border-slate-800 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                      <span>Đang lắng nghe biến động số dư từ ngân hàng...</span>
                    </div>

                    <button
                      type="button"
                      onClick={handleSimulatePayment}
                      disabled={simulatingWebhook}
                      className="px-3 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-[11px] font-bold text-emerald-400 hover:bg-emerald-500/20 transition-all disabled:opacity-50"
                    >
                      {simulatingWebhook ? "Đang giả lập..." : "⚡ Giả lập thanh toán thành công (Dev Test)"}
                    </button>
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
              <p>• {t.checkout.refundCommitment} ({siteSettings.refundDays || 7} {language === "en" ? "days" : "ngày"}).</p>
              <p>• {t.checkout.supportCommitment}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

