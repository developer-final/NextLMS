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
  });

  // Fetch public site and payment settings
  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/settings/public");
        if (res.ok) {
          const data = await res.json();
          if (data.settings) {
            setSiteSettings(data.settings);
          }
        }
      } catch (e) {
        // Fallback to default
      }
    }
    loadSettings();
  }, []);

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
    if (!couponCode) return;
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
    setIsProcessingOrder(true);
    try {
      const res = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: course.id,
          couponCode: appliedCoupon?.code,
          paymentMethod: isFree ? "FREE" : "VIETQR_AUTO",
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
                ) : (
                  <>
                    <CreditCard className="h-5 w-5" /> {t.checkout.proceedPaymentBtn} ({formatVND(finalPrice)})
                  </>
                )}
              </button>
            </>
          )}

          {/* If Order IS CREATED -> Show VietQR Transfer Guide */}
          {createdOrder && !isFree && (
            <div className="rounded-3xl border border-brand-500/30 bg-slate-900/90 p-6 space-y-6 shadow-glow">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <span className="text-[11px] font-bold text-brand-400 uppercase">
                    {t.checkout.orderCodeLabel} #{createdOrder.orderCode}
                  </span>
                  <h3 className="text-lg font-bold text-white">
                    {t.checkout.vietqrGuideTitle}
                  </h3>
                </div>
                <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-bold text-amber-400 border border-amber-500/30">
                  {t.checkout.pendingPaymentBadge}
                </span>
              </div>

              {/* VietQR Display */}
              {isOrderCompletedRealtime ? (
                <div className="rounded-2xl border border-emerald-500/50 bg-emerald-950/50 p-6 text-center space-y-4">
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
              ) : (
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
              )}

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

