import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";

// Load .env.production.local manually
const envPath = path.resolve(process.cwd(), ".env.production.local");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const recipient = process.argv[2] || process.env.SMTP_USER;

if (!recipient) {
  console.log("Usage: node scripts/test-smtp.mjs <your_email@gmail.com>");
  process.exit(1);
}

const host = process.env.SMTP_HOST || "smtp.gmail.com";
const port = parseInt(process.env.SMTP_PORT || "465", 10);
const secure = process.env.SMTP_SECURE !== "false";
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS?.replace(/\s+/g, "");
const from = process.env.EMAIL_FROM || `World Trading Lab <${user}>`;

console.log("----------------------------------------");
console.log("📧 Testing SMTP Connection with:");
console.log(`   Host: ${host}:${port} (secure: ${secure})`);
console.log(`   User: ${user || "(NOT SET)"}`);
console.log(`   From: ${from}`);
console.log(`   To:   ${recipient}`);
console.log("----------------------------------------");

if (!user || !pass) {
  console.error("❌ Error: SMTP_USER or SMTP_PASS is missing in environment!");
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host,
  port,
  secure,
  auth: { user, pass },
});

try {
  console.log("⏳ Verifying SMTP credentials...");
  await transporter.verify();
  console.log("✅ SMTP credentials verified successfully!");

  console.log("⏳ Sending test email...");
  const info = await transporter.sendMail({
    from,
    to: recipient,
    subject: "✅ [World Trading Lab] Kiểm tra kết nối gửi Email thành công",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 24px; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
        <h2 style="color: #10b981; margin-top: 0;">🎉 Kết nối gửi Email thành công!</h2>
        <p style="font-size: 15px; color: #334155; line-height: 1.6;">
          Xin chào, hệ thống E-Learning <b>World Trading Lab</b> đã kết nối thành công với tài khoản Gmail <b>${user}</b> qua cổng bảo mật SSL.
        </p>
        <div style="background: #f8fafc; border-left: 4px solid #10b981; padding: 12px 16px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0; font-size: 14px; color: #475569;">
            ✅ <b>Trạng thái:</b> Sẵn sàng gửi mã xác thực, hóa đơn và thông báo học tập.<br/>
            ⏰ <b>Thời gian gửi:</b> ${new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}
          </p>
        </div>
        <p style="font-size: 13px; color: #94a3b8; margin-bottom: 0;">
          Email tự động được gửi từ hệ thống World Trading Lab.
        </p>
      </div>
    `,
  });

  console.log("🎉 Email sent successfully! Message ID:", info.messageId);
} catch (error) {
  console.error("❌ Failed to send email:", error.message);
}
