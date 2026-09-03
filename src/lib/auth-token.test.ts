import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import crypto from "crypto";
import nodemailer from "nodemailer";
import {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendOrderConfirmationEmail,
  sendQAReplyEmail,
  sendStudyReminderEmail,
} from "./email";
import {
  getVerificationEmailHtml,
  getPasswordResetEmailHtml,
  getOrderConfirmationEmailHtml,
  getQAReplyEmailHtml,
  getStudyReminderEmailHtml,
} from "./email-templates";

describe("Email & Token Utilities", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("Token Generation & Expiration Logic", () => {
    it("should generate cryptographically secure 64-character hex tokens", () => {
      const token1 = crypto.randomBytes(32).toString("hex");
      const token2 = crypto.randomBytes(32).toString("hex");

      expect(token1).toHaveLength(64);
      expect(token2).toHaveLength(64);
      expect(token1).not.toEqual(token2);
    });

    it("should calculate 15-minute expiration for password reset tokens correctly", () => {
      const now = Date.now();
      const expiresAt = new Date(now + 15 * 60 * 1000);
      const diffMinutes = (expiresAt.getTime() - now) / (60 * 1000);

      expect(diffMinutes).toBeCloseTo(15, 1);
    });

    it("should calculate 24-hour expiration for email verification tokens correctly", () => {
      const now = Date.now();
      const expiresAt = new Date(now + 24 * 60 * 60 * 1000);
      const diffHours = (expiresAt.getTime() - now) / (60 * 60 * 1000);

      expect(diffHours).toBeCloseTo(24, 1);
    });
  });

  describe("Email HTML Templates", () => {
    it("should render verification email with correct recipient name and link", () => {
      const html = getVerificationEmailHtml({
        name: "Trần Văn A",
        verifyUrl: "http://localhost:3000/auth/verify-email?token=xyz123",
        token: "xyz123",
      });

      expect(html).toContain("Trần Văn A");
      expect(html).toContain("http://localhost:3000/auth/verify-email?token=xyz123");
      expect(html).toContain("Kích Hoạt Tài Khoản Ngay");
    });

    it("should render password reset email with 15-minute security alert", () => {
      const html = getPasswordResetEmailHtml({
        name: "Lê Thị B",
        resetUrl: "http://localhost:3000/auth/reset-password?token=reset123",
        token: "reset123",
      });

      expect(html).toContain("Lê Thị B");
      expect(html).toContain("http://localhost:3000/auth/reset-password?token=reset123");
      expect(html).toContain("15 phút");
      expect(html).toContain("Đặt Lại Mật Khẩu");
    });

    it("should render order confirmation email with courses and amount", () => {
      const html = getOrderConfirmationEmailHtml({
        name: "Nguyễn Văn C",
        orderCode: "ORD-998877",
        totalAmount: "1.990.000 đ",
        items: [{ title: "Khóa học Forex SMC Master", price: "1.990.000 đ" }],
        learnUrl: "http://localhost:3000/my-courses",
      });

      expect(html).toContain("ORD-998877");
      expect(html).toContain("1.990.000 đ");
      expect(html).toContain("Khóa học Forex SMC Master");
      expect(html).toContain("Vào Học Ngay Bây Giờ");
    });

    it("should render QA reply notification email with instructor answer", () => {
      const html = getQAReplyEmailHtml({
        studentName: "Học viên D",
        replierName: "Giảng viên Minh",
        lessonTitle: "Bài 3: Cấu trúc thị trường Bullish BOS",
        replyContent: "Vùng Order Block hợp lệ khi có Fair Value Gap kèm theo.",
        lessonUrl: "http://localhost:3000/learn/smc/lesson-3#qa",
      });

      expect(html).toContain("Học viên D");
      expect(html).toContain("Giảng viên Minh");
      expect(html).toContain("Cấu trúc thị trường Bullish BOS");
      expect(html).toContain("Vùng Order Block hợp lệ");
    });

    it("should render 5-day study reminder email with progress percent", () => {
      const html = getStudyReminderEmailHtml({
        studentName: "Học viên E",
        courseTitle: "Quản trị vốn & Tâm lý Trading",
        progressPercent: 45,
        continueUrl: "http://localhost:3000/courses/risk-management",
      });

      expect(html).toContain("Học viên E");
      expect(html).toContain("Quản trị vốn & Tâm lý Trading");
      expect(html).toContain("45%");
      expect(html).toContain("Tiếp Tục Khóa Học Ngay");
    });
  });

  describe("Email Dispatcher with Multi-Channel & Dev Simulation Fallback", () => {
    let savedResendKey: string | undefined;
    let savedSmtpUser: string | undefined;
    let savedSmtpPass: string | undefined;

    beforeEach(() => {
      savedResendKey = process.env.RESEND_API_KEY;
      savedSmtpUser = process.env.SMTP_USER;
      savedSmtpPass = process.env.SMTP_PASS;

      delete process.env.RESEND_API_KEY;
      delete process.env.SMTP_USER;
      delete process.env.SMTP_PASS;
    });

    afterEach(() => {
      if (savedResendKey !== undefined) {
        process.env.RESEND_API_KEY = savedResendKey;
      } else {
        delete process.env.RESEND_API_KEY;
      }

      if (savedSmtpUser !== undefined) {
        process.env.SMTP_USER = savedSmtpUser;
      } else {
        delete process.env.SMTP_USER;
      }

      if (savedSmtpPass !== undefined) {
        process.env.SMTP_PASS = savedSmtpPass;
      } else {
        delete process.env.SMTP_PASS;
      }
    });

    it("should simulate email dispatch when neither SMTP nor Resend is set", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      const result = await sendEmail({
        to: "student@test.com",
        subject: "Xác thực tài khoản",
        html: "<p>Hello</p>",
        actionUrl: "http://localhost:3000/test",
      });

      expect(result.success).toBe(true);
      expect(result.simulated).toBe(true);
      expect(consoleSpy).toHaveBeenCalled();
    });

    it("should trigger sendVerificationEmail in simulation mode without errors", async () => {
      const res = await sendVerificationEmail({
        to: "verify@test.com",
        name: "Test Student",
        token: "tok12345",
      });

      expect(res.success).toBe(true);
      expect(res.simulated).toBe(true);
    });

    it("should trigger sendPasswordResetEmail in simulation mode without errors", async () => {
      const res = await sendPasswordResetEmail({
        to: "reset@test.com",
        name: "Test Reset",
        token: "tok67890",
      });

      expect(res.success).toBe(true);
      expect(res.simulated).toBe(true);
    });

    it("should trigger sendOrderConfirmationEmail in simulation mode without errors", async () => {
      const res = await sendOrderConfirmationEmail({
        to: "order@test.com",
        name: "Buyer",
        orderCode: "ORD-123",
        totalAmount: "500.000 đ",
        items: [{ title: "Course 1", price: "500.000 đ" }],
      });

      expect(res.success).toBe(true);
      expect(res.simulated).toBe(true);
    });

    it("should trigger sendQAReplyEmail in simulation mode without errors", async () => {
      const res = await sendQAReplyEmail({
        to: "qa@test.com",
        studentName: "Student",
        replierName: "Mentor",
        lessonTitle: "Lesson 1",
        replyContent: "Good question!",
        courseSlug: "course-1",
        lessonSlug: "lesson-1",
      });

      expect(res.success).toBe(true);
      expect(res.simulated).toBe(true);
    });

    it("should trigger sendStudyReminderEmail in simulation mode without errors", async () => {
      const res = await sendStudyReminderEmail({
        to: "reminder@test.com",
        studentName: "Student",
        courseTitle: "Course 1",
        progressPercent: 30,
        courseSlug: "course-1",
      });

      expect(res.success).toBe(true);
      expect(res.simulated).toBe(true);
    });

    it("should dispatch email via SMTP when SMTP_USER and SMTP_PASS are configured", async () => {
      process.env.SMTP_USER = "sender@gmail.com";
      process.env.SMTP_PASS = "mock_16_char_pass";

      const sendMailMock = vi.fn().mockResolvedValue({ messageId: "smtp_msg_1001" });
      const createTransportSpy = vi.spyOn(nodemailer, "createTransport").mockReturnValue({
        sendMail: sendMailMock,
      } as any);

      const result = await sendEmail({
        to: "learner@test.com",
        subject: "SMTP Test Subject",
        html: "<p>SMTP Test HTML</p>",
      });

      expect(result.success).toBe(true);
      expect(result.simulated).toBe(false);
      expect(result.messageId).toBe("smtp_msg_1001");
      expect(createTransportSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          host: "smtp.gmail.com",
          port: 465,
          secure: true,
          auth: {
            user: "sender@gmail.com",
            pass: "mock_16_char_pass",
          },
        })
      );
      expect(sendMailMock).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "learner@test.com",
          subject: "SMTP Test Subject",
          html: "<p>SMTP Test HTML</p>",
        })
      );
    });

    it("should handle SMTP errors gracefully", async () => {
      process.env.SMTP_USER = "sender@gmail.com";
      process.env.SMTP_PASS = "bad_password";

      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      vi.spyOn(nodemailer, "createTransport").mockReturnValue({
        sendMail: vi.fn().mockRejectedValue(new Error("Invalid login: 535-5.7.8 Username and Password not accepted")),
      } as any);

      const result = await sendEmail({
        to: "learner@test.com",
        subject: "Failing Subject",
        html: "<p>Will fail</p>",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid login");
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it("should call Resend REST API when RESEND_API_KEY is provided and SMTP is not set", async () => {
      process.env.RESEND_API_KEY = "re_test_mock_valid_key";

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: "msg_mock_12345" }),
      });
      global.fetch = mockFetch;

      const result = await sendEmail({
        to: "api_user@test.com",
        subject: "Test API Resend",
        html: "<p>Content</p>",
      });

      expect(result.success).toBe(true);
      expect(result.simulated).toBe(false);
      expect(result.messageId).toBe("msg_mock_12345");
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.resend.com/emails",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer re_test_mock_valid_key",
          }),
        })
      );
    });
  });
});
