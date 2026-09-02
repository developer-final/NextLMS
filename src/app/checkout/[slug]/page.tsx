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

interface CheckoutPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default function CheckoutPage({ params }: CheckoutPageProps) {
  const { slug } = use(params);
  const { data: session, status } = useSession();
  const router = useRouter();

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

  // Fetch course info
  useEffect(() => {
    async function loadCourse() {
      try {
        const res = await fetch(`/api/courses/${slug}`);
        if (!res.ok) throw new Error("Course not found");
        const data = await res.json();
        setCourse(data);
      } catch (err) {
        toast.error("Không tìm thấy thông tin khóa học");
      } finally {
        setLoadingCourse(false);
      }
    }
    loadCourse();
  }, [slug]);

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
          <h2 className="text-xl font-bold text-white mb-2">Vui lòng đăng nhập</h2>
          <p className="text-xs text-slate-400 mb-6">
            Bạn cần đăng nhập hoặc tạo tài khoản để hoàn tất đăng ký khóa học này.
          </p>
          <Link
            href={`/auth/login?callbackUrl=/checkout/${slug}`}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-500 hover:bg-brand-400 px-6 py-3 text-sm font-bold text-slate-950 shadow-glow"
          >
            Đăng nhập ngay <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-20 text-slate-400">
        Khóa học không tồn tại hoặc đã bị gỡ.
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
        toast.error(data.error || "Mã giảm giá không hợp lệ");
        return;
      }
      setAppliedCoupon(data.coupon);
      toast.success(`Đã áp dụng mã giảm giá ${data.coupon.code}!`);
    } catch (err) {
      toast.error("Lỗi áp dụng mã giảm giá");
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
          toast.info("Bạn đã sở hữu khóa học này rồi!");
          router.push(`/courses/${slug}`);
          return;
        }
        toast.error(data.error || "Lỗi tạo đơn hàng");
        return;
      }

      setCreatedOrder(data.order);

      if (data.isFreeOrder) {
        toast.success("Kích hoạt khóa học thành công!");
        router.push(`/my-courses`);
      } else {
        toast.success("Đơn hàng đã được tạo! Vui lòng quét mã QR thanh toán.");
      }
    } catch (err) {
      toast.error("Đã xảy ra lỗi khi tạo đơn hàng");
    } finally {
      setIsProcessingOrder(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success(`Đã sao chép ${field}`);
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
        toast.error(data.error || "Lỗi gửi biên lai");
        return;
      }

      setProofSubmitted(true);
      toast.success(data.message);
    } catch (err) {
      toast.error("Lỗi gửi biên lai");
    } finally {
      setSubmittingProof(false);
    }
  };

  // Bank Info from ENV
  const bankId = process.env.NEXT_PUBLIC_BANK_ID || "MB";
  const bankAccountNo = process.env.NEXT_PUBLIC_BANK_ACCOUNT_NO || "0988888888";
  const bankAccountName = process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME || "NGUYEN VAN ADMIN";
  const transferContent = createdOrder ? createdOrder.orderCode : `EL ${course.slug.slice(0, 8)}`;

  const vietQRUrl = generateVietQRUrl({
    bankId,
    accountNo: bankAccountNo,
    accountName: bankAccountName,
    amount: finalPrice,
    description: transferContent,
  });

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8 border-b border-slate-800 pb-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
          Thanh toán & Đăng ký Khóa học
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Bảo mật thông tin thanh toán 100% • Kích hoạt học ngay
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
                {course.category?.name || "Khóa học"}
              </span>
              <h3 className="text-sm sm:text-base font-bold text-white line-clamp-2">
                {course.title}
              </h3>
              <p className="text-xs text-slate-400">
                Giảng viên: <strong className="text-slate-300">{course.instructor?.name}</strong>
              </p>
            </div>
          </div>

          {/* If Order is NOT yet created */}
          {!createdOrder && (
            <>
              {/* Coupon Form */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-1.5">
                  <Tag className="h-4 w-4 text-brand-400" /> Mã giảm giá (Coupon)
                </h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Nhập WTL50 hoặc TRADER200..."
                    className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white uppercase placeholder:normal-case placeholder-slate-500 focus:border-brand-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={applyingCoupon || !couponCode}
                    className="rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2 text-xs font-semibold text-white transition-colors disabled:opacity-50"
                  >
                    {applyingCoupon ? "Đang áp dụng..." : "Áp dụng"}
                  </button>
                </div>
                {appliedCoupon && (
                  <p className="mt-2 text-xs text-emerald-400 flex items-center gap-1">
                    <Check className="h-3.5 w-3.5" /> Mã {appliedCoupon.code} đã được áp dụng (-
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
                  "Đang khởi tạo đơn hàng..."
                ) : isFree ? (
                  <>
                    <Sparkles className="h-5 w-5" /> Kích hoạt Khóa học Miễn phí Ngay
                  </>
                ) : (
                  <>
                    <CreditCard className="h-5 w-5" /> Tiến hành Thanh toán ({formatVND(finalPrice)})
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
                    Đơn hàng #{createdOrder.orderCode}
                  </span>
                  <h3 className="text-lg font-bold text-white">
                    Hướng dẫn Quét mã VietQR Thanh toán
                  </h3>
                </div>
                <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-bold text-amber-400 border border-amber-500/30">
                  Chờ thanh toán
                </span>
              </div>

              {/* VietQR Display */}
              <div className="flex flex-col sm:flex-row gap-6 items-center">
                <div className="relative rounded-2xl overflow-hidden border-2 border-brand-500/50 p-2 bg-white flex-shrink-0 shadow-lg">
                  <img
                    src={vietQRUrl}
                    alt="VietQR Payment Code"
                    className="w-48 h-auto object-contain"
                  />
                </div>

                <div className="flex-1 space-y-3 w-full text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Ngân hàng thụ hưởng</span>
                      <strong className="text-white text-sm">{bankId} (MB Bank)</strong>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Số tài khoản</span>
                      <strong className="text-brand-400 text-sm">{bankAccountNo}</strong>
                    </div>
                    <button
                      onClick={() => copyToClipboard(bankAccountNo, "Số tài khoản")}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                    >
                      {copiedField === "Số tài khoản" ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Chủ tài khoản</span>
                      <strong className="text-white">{bankAccountName}</strong>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-brand-950/40 border border-brand-500/40">
                    <div>
                      <span className="text-brand-300 block text-[10px]">Nội dung chuyển khoản (Bắt buộc)</span>
                      <strong className="text-brand-400 text-sm">{createdOrder.orderCode}</strong>
                    </div>
                    <button
                      onClick={() => copyToClipboard(createdOrder.orderCode, "Nội dung")}
                      className="p-1.5 rounded-lg bg-brand-900 text-brand-300 hover:bg-brand-800"
                    >
                      {copiedField === "Nội dung" ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Upload Proof / Confirmation */}
              <div className="border-t border-slate-800 pt-5 space-y-3">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <UploadCloud className="h-4 w-4 text-brand-400" /> Xác nhận đã chuyển khoản
                </h4>
                <p className="text-[11px] text-slate-400">
                  Sau khi chuyển tiền xong, bạn có thể bấm nút xác nhận dưới đây để ban quản trị duyệt kích hoạt khóa học nhanh nhất.
                </p>

                {proofSubmitted ? (
                  <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/40 p-3.5 text-xs text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                    <span>
                      Đã gửi xác nhận! Khóa học sẽ được kích hoạt trong vòng 1-5 phút. Bạn có thể kiểm tra tại mục <strong>Khóa học của tôi</strong>.
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={proofUrl}
                      onChange={(e) => setProofUrl(e.target.value)}
                      placeholder="Link ảnh chụp biên lai (tùy chọn)..."
                      className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
                    />
                    <button
                      onClick={handleSendProof}
                      disabled={submittingProof}
                      className="rounded-xl bg-brand-500 hover:bg-brand-400 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-glow disabled:opacity-50 transition-all"
                    >
                      {submittingProof ? "Đang gửi..." : "Tôi đã chuyển khoản xong"}
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
              Tóm tắt Đơn hàng
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Học phí gốc:</span>
                <span className="text-slate-200">{formatVND(course.price)}</span>
              </div>

              {course.salePrice !== null && course.price > course.salePrice && (
                <div className="flex justify-between text-emerald-400">
                  <span>Ưu đãi khóa học:</span>
                  <span>-{formatVND(course.price - course.salePrice)}</span>
                </div>
              )}

              {discountValue > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Mã giảm giá ({appliedCoupon?.code}):</span>
                  <span>-{formatVND(discountValue)}</span>
                </div>
              )}

              <div className="border-t border-slate-800 pt-3 flex justify-between items-baseline">
                <span className="text-sm font-bold text-white">Tổng thanh toán:</span>
                <span className="text-2xl font-black text-brand-400">
                  {formatVND(finalPrice)}
                </span>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-950/60 p-4 border border-slate-800/80 space-y-2 text-[11px] text-slate-400">
              <div className="flex items-center gap-2 text-slate-300 font-semibold">
                <ShieldCheck className="h-4 w-4 text-brand-400" /> Cam kết chất lượng 100%
              </div>
              <p>• Hoàn tiền 100% trong 7 ngày nếu không hài lòng với nội dung.</p>
              <p>• Hỗ trợ kỹ thuật và giải đáp thắc mắc 24/7 qua Zalo/Email.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
