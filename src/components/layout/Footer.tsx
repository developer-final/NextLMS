import Link from "next/link";
import { GraduationCap, ShieldCheck, Zap, Mail, Phone, Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950/90 text-slate-400">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Col */}
          <div className="md:col-span-1 space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 text-slate-950 font-bold shadow-glow">
                <GraduationCap className="h-5 w-5 text-slate-950" />
              </div>
              <span className="text-lg font-extrabold tracking-tight text-white">
                World Trading <span className="text-brand-400">Lab</span>
              </span>
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed">
              Nền tảng đào tạo trực tuyến hàng đầu về Giao dịch Tài chính, Đầu tư Chứng khoán, Crypto và Kỹ năng Thực chiến.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck className="h-4 w-4 text-brand-400" />
              Bảo mật SSL 256-bit & Kích hoạt Tự động
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">Khóa học Nổi bật</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/courses" className="hover:text-brand-400 transition-colors">
                  Trading Thực chiến SMC & Price Action
                </Link>
              </li>
              <li>
                <Link href="/courses" className="hover:text-brand-400 transition-colors">
                  Phân tích Kỹ thuật Toàn diện
                </Link>
              </li>
              <li>
                <Link href="/courses" className="hover:text-brand-400 transition-colors">
                  Quản trị Rủi ro & Tâm lý Giao dịch
                </Link>
              </li>
              <li>
                <Link href="/courses" className="hover:text-brand-400 transition-colors">
                  Lập trình Bot Giao dịch Tự động
                </Link>
              </li>
            </ul>
          </div>

          {/* Policies & Support */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">Hỗ trợ & Chính sách</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/policy/payment" className="hover:text-brand-400 transition-colors">
                  Hướng dẫn Thanh toán VietQR
                </Link>
              </li>
              <li>
                <Link href="/policy/terms" className="hover:text-brand-400 transition-colors">
                  Điều khoản Dịch vụ
                </Link>
              </li>
              <li>
                <Link href="/policy/privacy" className="hover:text-brand-400 transition-colors">
                  Chính sách Bảo mật Thông tin
                </Link>
              </li>
              <li>
                <Link href="/policy/refund" className="hover:text-brand-400 transition-colors">
                  Chính sách Cam kết & Hoàn tiền
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Col */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">Liên hệ Trực tiếp</h4>
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <Mail className="h-4 w-4 text-brand-400" />
              <span>support@worldtradinglab.com</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <Phone className="h-4 w-4 text-brand-400" />
              <span>Hotline/Zalo: 0988.888.888</span>
            </div>
            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-[11px] text-slate-400">
              <span className="font-semibold text-brand-400">Hỗ trợ 24/7:</span> Duyệt đơn kích hoạt khóa học nhanh chóng qua mã QR VietQR hoặc Zalo Admin.
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-800/80 pt-6 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500">
          <p>© {new Date().getFullYear()} World Trading Lab. Đã đăng ký bản quyền.</p>
          <p className="flex items-center gap-1 mt-2 md:mt-0">
            Xây dựng với đam mê và tinh thần phụng sự học viên
          </p>
        </div>
      </div>
    </footer>
  );
}
