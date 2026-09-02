import {
  getVerificationEmailHtml,
  getPasswordResetEmailHtml,
  getOrderConfirmationEmailHtml,
  getQAReplyEmailHtml,
  getStudyReminderEmailHtml,
} from "./email-templates";

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  actionUrl?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  simulated?: boolean;
  error?: string;
}

/**
 * Base email dispatcher.
 * Automatically switches between Resend REST API (if RESEND_API_KEY is present)
 * and development console logging fallback.
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
  actionUrl,
}: SendEmailOptions): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from =
    process.env.EMAIL_FROM || "World Trading Lab <onboarding@resend.dev>";

  // Fallback: If no API key provided, simulate sending by logging to console
  if (!apiKey) {
    console.log("\n" + "=".repeat(64));
    console.log("📧 [EMAIL SIMULATION] Resend API Key is not set or in Dev mode");
    console.log(`   To:         ${to}`);
    console.log(`   From:       ${from}`);
    console.log(`   Subject:    ${subject}`);
    if (actionUrl) {
      console.log(`   Action URL: 🔗 ${actionUrl}`);
    }
    console.log("=".repeat(64) + "\n");
    return { success: true, simulated: true };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        html,
        text: text || undefined,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("[Email Error] Resend API responded with error:", data);
      return {
        success: false,
        error: data?.message || "Failed to send email via Resend",
      };
    }

    return {
      success: true,
      messageId: data.id,
      simulated: false,
    };
  } catch (error: any) {
    console.error("[Email Error] Exception sending email:", error);
    return {
      success: false,
      error: error?.message || "Internal email transmission failure",
    };
  }
}

/**
 * Send Account Verification Email with unique token.
 */
export async function sendVerificationEmail({
  to,
  name,
  token,
  appUrl,
}: {
  to: string;
  name: string;
  token: string;
  appUrl?: string;
}) {
  const baseUrl =
    appUrl || process.env.NEXTAUTH_URL || "http://localhost:3000";
  const verifyUrl = `${baseUrl}/auth/verify-email?token=${encodeURIComponent(
    token
  )}`;

  const html = getVerificationEmailHtml({
    name,
    verifyUrl,
    token,
  });

  return sendEmail({
    to,
    subject: "Xác thực tài khoản của bạn tại World Trading Lab",
    html,
    actionUrl: verifyUrl,
  });
}

/**
 * Send Password Reset Email with 15-minute token.
 */
export async function sendPasswordResetEmail({
  to,
  name,
  token,
  appUrl,
}: {
  to: string;
  name: string;
  token: string;
  appUrl?: string;
}) {
  const baseUrl =
    appUrl || process.env.NEXTAUTH_URL || "http://localhost:3000";
  const resetUrl = `${baseUrl}/auth/reset-password?token=${encodeURIComponent(
    token
  )}`;

  const html = getPasswordResetEmailHtml({
    name,
    resetUrl,
    token,
  });

  return sendEmail({
    to,
    subject: "Yêu cầu đặt lại mật khẩu - World Trading Lab",
    html,
    actionUrl: resetUrl,
  });
}

/**
 * Send Order Confirmation & Onboarding Email.
 */
export async function sendOrderConfirmationEmail({
  to,
  name,
  orderCode,
  totalAmount,
  items,
  appUrl,
}: {
  to: string;
  name: string;
  orderCode: string;
  totalAmount: string;
  items: Array<{ title: string; price: string }>;
  appUrl?: string;
}) {
  const baseUrl =
    appUrl || process.env.NEXTAUTH_URL || "http://localhost:3000";
  const learnUrl = `${baseUrl}/my-courses`;

  const html = getOrderConfirmationEmailHtml({
    name,
    orderCode,
    totalAmount,
    items,
    learnUrl,
  });

  return sendEmail({
    to,
    subject: `Xác nhận thanh toán thành công #${orderCode} - World Trading Lab`,
    html,
    actionUrl: learnUrl,
  });
}

/**
 * Send Q&A Discussion Reply Notification Email.
 */
export async function sendQAReplyEmail({
  to,
  studentName,
  replierName,
  lessonTitle,
  replyContent,
  courseSlug,
  lessonSlug,
  appUrl,
}: {
  to: string;
  studentName: string;
  replierName: string;
  lessonTitle: string;
  replyContent: string;
  courseSlug: string;
  lessonSlug: string;
  appUrl?: string;
}) {
  const baseUrl =
    appUrl || process.env.NEXTAUTH_URL || "http://localhost:3000";
  const lessonUrl = `${baseUrl}/learn/${courseSlug}/${lessonSlug}#qa`;

  const html = getQAReplyEmailHtml({
    studentName,
    replierName,
    lessonTitle,
    replyContent,
    lessonUrl,
  });

  return sendEmail({
    to,
    subject: `${replierName} đã trả lời thắc mắc của bạn - World Trading Lab`,
    html,
    actionUrl: lessonUrl,
  });
}

/**
 * Send 5-Day Study Reminder Email.
 */
export async function sendStudyReminderEmail({
  to,
  studentName,
  courseTitle,
  progressPercent,
  courseSlug,
  appUrl,
}: {
  to: string;
  studentName: string;
  courseTitle: string;
  progressPercent: number;
  courseSlug: string;
  appUrl?: string;
}) {
  const baseUrl =
    appUrl || process.env.NEXTAUTH_URL || "http://localhost:3000";
  const continueUrl = `${baseUrl}/courses/${courseSlug}`;

  const html = getStudyReminderEmailHtml({
    studentName,
    courseTitle,
    progressPercent,
    continueUrl,
  });

  return sendEmail({
    to,
    subject: `Dành 15 phút hôm nay cùng khóa học ${courseTitle} nhé!`,
    html,
    actionUrl: continueUrl,
  });
}
