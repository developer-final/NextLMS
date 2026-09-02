export default function PaymentPolicyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12 space-y-6 text-xs text-slate-300">
      <h1 className="text-2xl font-bold text-white mb-4">Hướng dẫn Thanh toán VietQR & Kích hoạt</h1>
      <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 leading-relaxed">
        <h3 className="text-sm font-bold text-brand-400">1. Quy trình Thanh toán qua VietQR:</h3>
        <p>• Bước 1: Chọn khóa học muốn mua và bấm "Đăng ký khóa học ngay".</p>
        <p>• Bước 2: Nhập mã giảm giá (nếu có) và bấm "Tiến hành thanh toán".</p>
        <p>• Bước 3: Mở ứng dụng ngân hàng trên điện thoại (Mobile Banking), quét mã VietQR hiển thị trên màn hình.</p>
        <p>• Bước 4: Kiểm tra số tiền và nội dung chuyển khoản (chứa mã đơn hàng <code>EL-XXXXX</code>) rồi bấm Xác nhận chuyển tiền.</p>
        
        <h3 className="text-sm font-bold text-brand-400 pt-2">2. Thời gian Kích hoạt Khóa học:</h3>
        <p>• Hệ thống sẽ tự động kích hoạt tài khoản trong vòng 1-5 phút sau khi nhận được chuyển khoản hợp lệ.</p>
        <p>• Nếu sau 15 phút chưa được kích hoạt, học viên vui lòng liên hệ Hotline/Zalo: <strong>0988.888.888</strong> kèm mã đơn hàng để được hỗ trợ tức thì.</p>
      </div>
    </div>
  );
}
