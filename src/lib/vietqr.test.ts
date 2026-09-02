import { describe, it, expect } from "vitest";
import { generateVietQRUrl } from "./vietqr";

describe("VietQR Generator Library", () => {
  it("should generate a valid VietQR QuickPay URL with default bank configuration", () => {
    const url = generateVietQRUrl({
      amount: 1500000,
      description: "EL-M3K4J8-A1B2C3D4",
    });

    expect(url).toContain("https://img.vietqr.io/image/");
    expect(url).toContain("compact2.png");
    expect(url).toContain("amount=1500000");
    expect(url).toContain("addInfo=EL-M3K4J8-A1B2C3D4");
  });

  it("should support custom bank parameters and templates", () => {
    const url = generateVietQRUrl({
      bankId: "VCB",
      accountNo: "1234567890",
      accountName: "NGUYEN VAN A",
      amount: 990000,
      description: "THANH TOAN KHOA HOC",
      template: "qr_only",
    });

    expect(url).toBe(
      "https://img.vietqr.io/image/VCB-1234567890-qr_only.png?amount=990000&addInfo=THANH%20TOAN%20KHOA%20HOC&accountName=NGUYEN%20VAN%20A"
    );
  });

  it("should round fractional amounts to integers", () => {
    const url = generateVietQRUrl({
      amount: 500000.75,
      description: "ORDER-01",
    });

    expect(url).toContain("amount=500001");
  });

  it("should properly URL-encode special characters in account name and description", () => {
    const url = generateVietQRUrl({
      bankId: "TCB",
      accountNo: "9876543210",
      accountName: "CÔNG TY WORLD TRADING & LAB",
      amount: 2000000,
      description: "HỌC PHÍ #123 (FOREX & CRYPTO)",
    });

    expect(url).toContain("accountName=C%C3%94NG%20TY%20WORLD%20TRADING%20%26%20LAB");
    expect(url).toContain("addInfo=H%E1%BB%8CC%20PH%C3%8D%20%23123%20(FOREX%20%26%20CRYPTO)");
  });
});
