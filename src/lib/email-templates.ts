// Email HTML templates for World Trading Lab transactional communications

const BRAND_COLOR = "#10b981"; // emerald-500
const BG_DARK = "#090d16"; // deep slate-950
const CARD_BG = "#111827"; // slate-900
const TEXT_MUTED = "#94a3b8"; // slate-400
const BORDER_COLOR = "#1e293b"; // slate-800

function wrapEmailLayout({
  title,
  preheader,
  content,
}: {
  title: string;
  preheader: string;
  content: string;
}): string {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; background-color: ${BG_DARK}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc; }
    .container { max-width: 600px; margin: 0 auto; padding: 32px 16px; }
    .card { background-color: ${CARD_BG}; border: 1px solid ${BORDER_COLOR}; border-radius: 20px; padding: 36px 28px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }
    .logo { font-size: 20px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff; text-align: center; margin-bottom: 28px; }
    .logo span { color: ${BRAND_COLOR}; }
    .btn { display: inline-block; background-color: ${BRAND_COLOR}; color: #022c22 !important; font-weight: 700; font-size: 15px; padding: 14px 28px; text-decoration: none; border-radius: 12px; margin: 24px 0; text-align: center; }
    .btn:hover { background-color: #34d399; }
    .footer { text-align: center; font-size: 12px; color: ${TEXT_MUTED}; margin-top: 32px; line-height: 1.6; }
    .token-box { background: #0b1120; border: 1px dashed #334155; border-radius: 10px; padding: 14px; text-align: center; font-family: monospace; font-size: 18px; letter-spacing: 2px; color: #38bdf8; margin: 16px 0; }
    .divider { height: 1px; background-color: ${BORDER_COLOR}; margin: 24px 0; }
  </style>
</head>
<body>
  <div style="display:none;font-size:1px;color:#333;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    ${preheader}
  </div>
  <div class="container">
    <div class="logo">
      WORLD TRADING <span>LAB</span>
    </div>
    <div class="card">
      ${content}
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} World Trading Lab. All rights reserved.</p>
      <p>Nền tảng đào tạo đầu tư & phân tích tài chính thực chiến chuẩn quốc tế.</p>
      <p>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email hoặc liên hệ hỗ trợ.</p>
    </div>
  </div>
</body>
</html>`;
}

export function getVerificationEmailHtml({
  name,
  verifyUrl,
  token,
}: {
  name: string;
  verifyUrl: string;
  token: string;
}): string {
  const content = `
    <h2 style="margin-top:0;font-size:22px;color:#ffffff;font-weight:700;">Chào mừng bạn đến với World Trading Lab! 🎓</h2>
    <p style="color:${TEXT_MUTED};font-size:15px;line-height:1.6;">
      Xin chào <strong style="color:#ffffff;">${name}</strong>,
    </p>
    <p style="color:${TEXT_MUTED};font-size:15px;line-height:1.6;">
      Cảm ơn bạn đã đăng ký tài khoản học viên tại World Trading Lab. Để kích hoạt tài khoản và bảo vệ quyền lợi học tập của bạn, vui lòng xác thực địa chỉ email bằng cách nhấn vào nút bên dưới:
    </p>
    <div style="text-align:center;">
      <a href="${verifyUrl}" class="btn" target="_blank">Kích Hoạt Tài Khoản Ngay →</a>
    </div>
    <p style="color:${TEXT_MUTED};font-size:13px;line-height:1.5;">
      Liên kết này có hiệu lực trong vòng <strong>24 giờ</strong>. Hoặc bạn có thể sao chép liên kết sau dán vào trình duyệt:
    </p>
    <p style="word-break:break-all;font-size:12px;color:#38bdf8;background:#0b1120;padding:10px;border-radius:8px;">
      ${verifyUrl}
    </p>
  `;

  return wrapEmailLayout({
    title: "Xác thực tài khoản học viên",
    preheader: "Kích hoạt tài khoản của bạn tại World Trading Lab để bắt đầu học ngay.",
    content,
  });
}

export function getPasswordResetEmailHtml({
  name,
  resetUrl,
  token,
}: {
  name: string;
  resetUrl: string;
  token: string;
}): string {
  const content = `
    <h2 style="margin-top:0;font-size:22px;color:#ffffff;font-weight:700;">Yêu cầu Đặt lại Mật khẩu 🔒</h2>
    <p style="color:${TEXT_MUTED};font-size:15px;line-height:1.6;">
      Xin chào <strong style="color:#ffffff;">${name}</strong>,
    </p>
    <p style="color:${TEXT_MUTED};font-size:15px;line-height:1.6;">
      Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản World Trading Lab liên kết với email này.
    </p>
    <p style="color:${TEXT_MUTED};font-size:15px;line-height:1.6;">
      Vui lòng nhấn vào nút bên dưới để tạo mật khẩu mới:
    </p>
    <div style="text-align:center;">
      <a href="${resetUrl}" class="btn" target="_blank" style="background-color:#eab308;color:#422006 !important;">Đặt Lại Mật Khẩu →</a>
    </div>
    <div style="background:#451a03;border:1px solid #78350f;padding:12px;border-radius:10px;margin-top:16px;">
      <p style="color:#fde047;font-size:13px;margin:0;line-height:1.5;">
        ⚠️ <strong>Lưu ý bảo mật:</strong> Liên kết này chỉ có hiệu lực trong vòng <strong>15 phút</strong> và chỉ sử dụng được 1 lần duy nhất. Nếu bạn không gửi yêu cầu này, vui lòng bỏ qua email và mật khẩu hiện tại vẫn an toàn.
      </p>
    </div>
  `;

  return wrapEmailLayout({
    title: "Yêu cầu đặt lại mật khẩu",
    preheader: "Liên kết đặt lại mật khẩu của bạn có hiệu lực trong 15 phút.",
    content,
  });
}

export function getOrderConfirmationEmailHtml({
  name,
  orderCode,
  totalAmount,
  items,
  learnUrl,
}: {
  name: string;
  orderCode: string;
  totalAmount: string;
  items: Array<{ title: string; price: string }>;
  learnUrl: string;
}): string {
  const itemsHtml = items
    .map(
      (item) => `
      <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid ${BORDER_COLOR};font-size:14px;">
        <span style="color:#ffffff;font-weight:600;">${item.title}</span>
        <span style="color:#34d399;font-weight:700;">${item.price}</span>
      </div>
    `
    )
    .join("");

  const content = `
    <h2 style="margin-top:0;font-size:22px;color:#34d399;font-weight:700;">Thanh Toán Thành Công! Khóa Học Đã Kích Hoạt 🚀</h2>
    <p style="color:${TEXT_MUTED};font-size:15px;line-height:1.6;">
      Xin chào <strong style="color:#ffffff;">${name}</strong>,
    </p>
    <p style="color:${TEXT_MUTED};font-size:15px;line-height:1.6;">
      Hệ thống World Trading Lab đã nhận được thanh toán và kích hoạt thành công khóa học cho tài khoản của bạn.
    </p>

    <div style="background:#0b1120;border:1px solid ${BORDER_COLOR};border-radius:12px;padding:16px;margin:20px 0;">
      <div style="font-size:13px;color:${TEXT_MUTED};margin-bottom:8px;">
        Mã đơn hàng: <strong style="color:#ffffff;">${orderCode}</strong>
      </div>
      <div class="divider" style="margin:10px 0;"></div>
      ${itemsHtml}
      <div style="display:flex;justify-content:space-between;padding-top:12px;font-size:16px;">
        <span style="color:#ffffff;font-weight:700;">Tổng thanh toán:</span>
        <span style="color:#fbbf24;font-weight:800;">${totalAmount}</span>
      </div>
    </div>

    <div style="text-align:center;">
      <a href="${learnUrl}" class="btn" target="_blank">Vào Học Ngay Bây Giờ →</a>
    </div>

    <p style="color:${TEXT_MUTED};font-size:13px;line-height:1.5;">
      💡 <strong>Mẹo học tập:</strong> Bạn có thể theo dõi tiến độ bài học, ghi chú và đặt câu hỏi trực tiếp cho giảng viên trong từng bài giảng.
    </p>
  `;

  return wrapEmailLayout({
    title: "Xác nhận đơn hàng & Kích hoạt khóa học",
    preheader: `Đơn hàng ${orderCode} đã kích hoạt thành công. Bắt đầu học ngay!`,
    content,
  });
}

export function getQAReplyEmailHtml({
  studentName,
  replierName,
  lessonTitle,
  replyContent,
  lessonUrl,
}: {
  studentName: string;
  replierName: string;
  lessonTitle: string;
  replyContent: string;
  lessonUrl: string;
}): string {
  const content = `
    <h2 style="margin-top:0;font-size:22px;color:#ffffff;font-weight:700;">Giảng viên đã trả lời câu hỏi của bạn! 💬</h2>
    <p style="color:${TEXT_MUTED};font-size:15px;line-height:1.6;">
      Xin chào <strong style="color:#ffffff;">${studentName}</strong>,
    </p>
    <p style="color:${TEXT_MUTED};font-size:15px;line-height:1.6;">
      <strong style="color:#38bdf8;">${replierName}</strong> vừa phản hồi thắc mắc của bạn tại bài học:
      <strong style="color:#ffffff;">"${lessonTitle}"</strong>.
    </p>

    <div style="background:#0b1120;border-left:4px solid ${BRAND_COLOR};padding:14px 16px;border-radius:0 12px 12px 0;margin:20px 0;font-size:14px;color:#cbd5e1;line-height:1.6;font-style:italic;">
      "${replyContent}"
    </div>

    <div style="text-align:center;">
      <a href="${lessonUrl}" class="btn" target="_blank">Xem Thảo Luận & Tiếp Tục Bài Học →</a>
    </div>
  `;

  return wrapEmailLayout({
    title: "Phản hồi câu hỏi Hỏi đáp Q&A",
    preheader: `${replierName} đã trả lời câu hỏi của bạn trong bài ${lessonTitle}.`,
    content,
  });
}

export function getStudyReminderEmailHtml({
  studentName,
  courseTitle,
  progressPercent,
  continueUrl,
}: {
  studentName: string;
  courseTitle: string;
  progressPercent: number;
  continueUrl: string;
}): string {
  const content = `
    <h2 style="margin-top:0;font-size:22px;color:#ffffff;font-weight:700;">Đừng để lỡ nhịp học hôm nay nhé! ⏰</h2>
    <p style="color:${TEXT_MUTED};font-size:15px;line-height:1.6;">
      Xin chào <strong style="color:#ffffff;">${studentName}</strong>,
    </p>
    <p style="color:${TEXT_MUTED};font-size:15px;line-height:1.6;">
      Đã hơn 5 ngày bạn chưa ghé lại khóa học <strong style="color:#ffffff;">"${courseTitle}"</strong>.
    </p>

    <div style="background:#0b1120;border:1px solid ${BORDER_COLOR};border-radius:14px;padding:20px;margin:20px 0;text-align:center;">
      <div style="font-size:13px;color:${TEXT_MUTED};margin-bottom:8px;">Tiến độ hiện tại của bạn:</div>
      <div style="font-size:28px;font-weight:800;color:${BRAND_COLOR};">${Math.round(progressPercent)}%</div>
      <p style="font-size:13px;color:${TEXT_MUTED};margin-top:8px;line-height:1.5;">
        Chỉ cần dành 15-20 phút mỗi ngày để rèn luyện tư duy giao dịch thực chiến và phương pháp quản trị rủi ro!
      </p>
    </div>

    <div style="text-align:center;">
      <a href="${continueUrl}" class="btn" target="_blank">Tiếp Tục Khóa Học Ngay →</a>
    </div>
  `;

  return wrapEmailLayout({
    title: "Nhắc nhở duy trì nhịp học tập",
    preheader: `Dành 15 phút hôm nay để tiếp tục chinh phục ${courseTitle}!`,
    content,
  });
}
