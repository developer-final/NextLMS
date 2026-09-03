import { describe, it, expect } from "vitest";
import { DEFAULT_CONFIG, invalidateSettingsCache } from "@/lib/config";

describe("Brand Configuration & Settings Cache", () => {
  it("should provide default appName fallback", () => {
    expect(DEFAULT_CONFIG.appName).toBeDefined();
    expect(typeof DEFAULT_CONFIG.appName).toBe("string");
  });

  it("should export invalidateSettingsCache function without errors", () => {
    expect(typeof invalidateSettingsCache).toBe("function");
    expect(() => invalidateSettingsCache()).not.toThrow();
  });
});
