import { getSystemSettings } from "@/lib/config";

export const revalidate = 0;

export default async function RefundPage() {
  const settings = await getSystemSettings();

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12 space-y-6 text-xs text-slate-300">
      <h1 className="text-2xl font-bold text-white mb-4">Chính sách Cam kết & Hoàn tiền</h1>
      <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 leading-relaxed">
        <p>
          {settings.appName} áp dụng chính sách{" "}
          <strong>Hoàn tiền 100% trong vòng {settings.refundDays} ngày</strong> kể từ thời điểm đăng ký nếu học viên đã xem dưới {settings.refundMaxProgress}% nội dung và cảm thấy chất lượng khóa học không đáp ứng kỳ vọng.
        </p>
        <p>
          Để yêu cầu hoàn tiền, học viên chỉ cần gửi email tới <code>{settings.supportEmail}</code> kèm mã đơn hàng và lý do cần hỗ trợ.
        </p>
      </div>
    </div>
  );
}
