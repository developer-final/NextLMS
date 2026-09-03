import { describe, it, expect } from "vitest";
import {
  VIETNAM_BANKS,
  POPULAR_BANK_CODES,
  getPopularBanks,
  getOtherBanks,
  getBankByCode,
} from "./vietnam-banks";

describe("Vietnam Banks Directory", () => {
  it("should contain all official Vietnam banks", () => {
    expect(VIETNAM_BANKS.length).toBeGreaterThanOrEqual(60);
  });

  it("should contain VietinBank with correct code and BIN", () => {
    const vietinBank = getBankByCode("ICB");
    expect(vietinBank).toBeDefined();
    expect(vietinBank?.shortName).toBe("VietinBank");
    expect(vietinBank?.bin).toBe("970415");
    expect(vietinBank?.name).toContain("Công thương");
  });

  it("should find bank by shortName or BIN case-insensitively", () => {
    const byShortName = getBankByCode("vietinbank");
    expect(byShortName).toBeDefined();
    expect(byShortName?.code).toBe("ICB");

    const byBin = getBankByCode("970415");
    expect(byBin).toBeDefined();
    expect(byBin?.code).toBe("ICB");

    const acb = getBankByCode("acb");
    expect(acb).toBeDefined();
    expect(acb?.shortName).toBe("ACB");
  });

  it("should contain major banks in popular list", () => {
    const popular = getPopularBanks();
    const codes = popular.map((b) => b.code);

    expect(codes).toContain("ICB");
    expect(codes).toContain("VCB");
    expect(codes).toContain("ACB");
    expect(codes).toContain("MB");
    expect(codes).toContain("TCB");
    expect(codes).toContain("BIDV");
    expect(codes).toContain("VBA");
  });

  it("should divide popular and other banks without overlapping", () => {
    const popular = getPopularBanks();
    const other = getOtherBanks();

    expect(popular.length + other.length).toBe(VIETNAM_BANKS.length);

    const popularCodes = new Set(popular.map((b) => b.code));
    for (const bank of other) {
      expect(popularCodes.has(bank.code)).toBe(false);
    }
  });

  it("should return undefined for non-existent bank", () => {
    expect(getBankByCode("INVALID_BANK_CODE_9999")).toBeUndefined();
    expect(getBankByCode("")).toBeUndefined();
    expect(getBankByCode(null)).toBeUndefined();
  });
});
