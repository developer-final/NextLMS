import { describe, it, expect } from "vitest";
import { THEMES, DEFAULT_THEME, isValidTheme } from "./theme";
import { getDictionary } from "./i18n";

describe("Theme System & Configuration", () => {
  it("should provide exactly 5 curated themes", () => {
    expect(THEMES).toHaveLength(5);
    const ids = THEMES.map((t) => t.id);
    expect(ids).toEqual(["emerald", "ocean", "amber", "crimson", "purple"]);
  });

  it("should set emerald as the default theme", () => {
    expect(DEFAULT_THEME).toBe("emerald");
    const defaultTheme = THEMES.find((t) => t.id === DEFAULT_THEME);
    expect(defaultTheme).toBeDefined();
    expect(defaultTheme?.primaryHex).toBe("#10b981");
  });

  it("should validate theme IDs correctly with isValidTheme", () => {
    expect(isValidTheme("emerald")).toBe(true);
    expect(isValidTheme("ocean")).toBe(true);
    expect(isValidTheme("amber")).toBe(true);
    expect(isValidTheme("crimson")).toBe(true);
    expect(isValidTheme("purple")).toBe(true);

    expect(isValidTheme("dark")).toBe(false);
    expect(isValidTheme("light")).toBe(false);
    expect(isValidTheme("")).toBe(false);
    expect(isValidTheme(null)).toBe(false);
    expect(isValidTheme(undefined)).toBe(false);
    expect(isValidTheme(123)).toBe(false);
  });

  it("should have valid hex color formats for all themes", () => {
    const hexPattern = /^#[0-9A-Fa-f]{6}$/;
    THEMES.forEach((t) => {
      expect(t.primaryHex).toMatch(hexPattern);
      expect(t.secondaryHex).toMatch(hexPattern);
    });
  });

  it("should have complete translations in both Vietnamese and English dictionaries", () => {
    const viDict = getDictionary("vi");
    const enDict = getDictionary("en");

    expect(viDict.theme).toBeDefined();
    expect(enDict.theme).toBeDefined();

    expect(viDict.theme.selectTheme).toBeTruthy();
    expect(enDict.theme.selectTheme).toBeTruthy();

    THEMES.forEach((item) => {
      expect(viDict.theme[item.nameKey]).toBeTruthy();
      expect(viDict.theme[item.descKey]).toBeTruthy();
      expect(enDict.theme[item.nameKey]).toBeTruthy();
      expect(enDict.theme[item.descKey]).toBeTruthy();
    });
  });
});
