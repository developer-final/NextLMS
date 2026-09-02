import { Award, CheckCircle2, GraduationCap, ShieldCheck, Users, Zap } from "lucide-react";
import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-950/60 px-4 py-1.5 text-xs font-semibold text-brand-400">
          <GraduationCap className="h-4 w-4" /> Về World Trading Lab
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white">
          Sứ Mệnh Đào Tạo Thế Hệ <br />
          <span className="gradient-text-emerald">Nhà Đầu Tư & Chuyên Gia Thực Chiến</span>
        </h1>
        <p className="text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed">
          World Trading Lab được thành lập với mục tiêu phổ cập kiến thức tài chính, đầu tư, phân tích kỹ thuật và kỹ năng giao dịch dòng tiền lớn chất lượng cao, giúp học viên làm chủ thị trường và gia tăng giá trị bản thân bền vững.
        </p>
      </div>

      {/* Core Values */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-3">
          <div className="h-10 w-10 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center border border-brand-500/20">
            <Zap className="h-5 w-5" />
          </div>
          <h3 className="text-base font-bold text-white">100% Thực Chiến</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Giáo trình không lý thuyết suông, tập trung vào các case study lệnh thực tế trên thị trường Forex, Vàng, Chứng khoán và Crypto.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-3">
          <div className="h-10 w-10 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center border border-brand-500/20">
            <Users className="h-5 w-5" />
          </div>
          <h3 className="text-base font-bold text-white">Đồng hành 1 - 1</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Học viên được tham gia nhóm trao đổi riêng, nhận hỗ trợ sửa lỗi phân tích trực tiếp từ đội ngũ giảng viên và trợ giảng.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-3">
          <div className="h-10 w-10 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center border border-brand-500/20">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h3 className="text-base font-bold text-white">Bảo mật & Uy tín</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Hệ thống thanh toán minh bạch, kích hoạt tức thì qua VietQR và cam kết hoàn tiền nếu không hài lòng.
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="rounded-3xl border border-slate-800 bg-gradient-to-r from-brand-950/40 via-slate-900 to-slate-950 p-8 text-center space-y-4">
        <h2 className="text-2xl font-bold text-white">Sẵn sàng nâng tầm kỹ năng của bạn?</h2>
        <p className="text-xs text-slate-400 max-w-lg mx-auto">
          Gia nhập cộng đồng hơn 5.000 học viên đang theo học và gặt hái thành công ngay hôm nay.
        </p>
        <Link
          href="/courses"
          className="inline-block rounded-xl bg-brand-500 hover:bg-brand-400 px-6 py-3 text-sm font-bold text-slate-950 shadow-glow transition-all hover:scale-105"
        >
          Khám phá Khóa học Ngay
        </Link>
      </div>
    </div>
  );
}
