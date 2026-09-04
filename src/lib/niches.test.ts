import { describe, it, expect } from "vitest";
import { NICHES, NicheType, resolveNicheConfig } from "@/lib/niches";

describe("Niches Configuration & Resolution", () => {
  const expectedNiches: NicheType[] = [
    "trading",
    "ielts",
    "baking",
    "fitness",
    "it",
    "electronics",
    "mechanical",
  ];

  it("should contain all 7 supported niches in NICHES dictionary", () => {
    expectedNiches.forEach((id) => {
      expect(NICHES[id]).toBeDefined();
      expect(NICHES[id].id).toBe(id);
      expect(NICHES[id].name).toBeTruthy();
      expect(NICHES[id].brandName).toBeTruthy();
      expect(NICHES[id].slogan).toBeTruthy();
      expect(NICHES[id].categorySlugs.length).toBeGreaterThan(0);
      expect(NICHES[id].features.length).toBe(3);
      expect(NICHES[id].about.values.length).toBe(3);
    });
  });

  it("should resolve niche config by valid nicheId", () => {
    const itConfig = resolveNicheConfig("it");
    expect(itConfig.id).toBe("it");
    expect(itConfig.brandName).toBe("DevCraft Tech Academy");

    const elecConfig = resolveNicheConfig("electronics");
    expect(elecConfig.id).toBe("electronics");
    expect(elecConfig.brandName).toBe("CircuitMaster Hardware Lab");

    const mechConfig = resolveNicheConfig("mechanical");
    expect(mechConfig.id).toBe("mechanical");
    expect(mechConfig.brandName).toBe("MechDesign Pro Academy");
  });

  it("should fallback to trading for unknown or empty nicheId", () => {
    const fallback = resolveNicheConfig("unknown_niche");
    expect(fallback.id).toBe("trading");

    const nullFallback = resolveNicheConfig(null);
    expect(nullFallback.id).toBe("trading");
  });

  it("should apply brand override dynamically", () => {
    const customized = resolveNicheConfig("it", "Google Cloud Academy");
    expect(customized.id).toBe("it");
    expect(customized.brandName).toBe("Google Cloud Academy");
    expect(customized.heroTitleLine1).toContain("Google Cloud Academy");
    expect(customized.about.badge).toBe("Về Google Cloud Academy");
  });
});
