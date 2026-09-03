import { describe, it, expect } from "vitest";
import {
  detectLanguageFromCountry,
  getCountryFromRequest,
  COUNTRY_TO_LANGUAGE_MAP,
  DEFAULT_FALLBACK_LANGUAGE,
} from "./geo";
import { NextRequest } from "next/server";

describe("i18n GeoIP Language Detection", () => {
  describe("detectLanguageFromCountry", () => {
    it("should map Vietnam (VN) to Vietnamese (vi)", () => {
      expect(detectLanguageFromCountry("VN")).toBe("vi");
      expect(detectLanguageFromCountry("vn")).toBe("vi");
      expect(detectLanguageFromCountry("Vn")).toBe("vi");
      expect(detectLanguageFromCountry(" vn ")).toBe("vi");
    });

    it("should map any other countries to English (en) by default", () => {
      expect(detectLanguageFromCountry("US")).toBe("en");
      expect(detectLanguageFromCountry("GB")).toBe("en");
      expect(detectLanguageFromCountry("SG")).toBe("en");
      expect(detectLanguageFromCountry("AU")).toBe("en");
    });

    it("should safely fallback to DEFAULT_FALLBACK_LANGUAGE on missing or null inputs", () => {
      expect(detectLanguageFromCountry(null)).toBe(DEFAULT_FALLBACK_LANGUAGE);
      expect(detectLanguageFromCountry(undefined)).toBe(DEFAULT_FALLBACK_LANGUAGE);
      expect(detectLanguageFromCountry("")).toBe(DEFAULT_FALLBACK_LANGUAGE);
      expect(detectLanguageFromCountry("UNKNOWN")).toBe(DEFAULT_FALLBACK_LANGUAGE);
    });

    it("verifies mapping configuration consistency", () => {
      expect(COUNTRY_TO_LANGUAGE_MAP.VN).toBe("vi");
      expect(DEFAULT_FALLBACK_LANGUAGE).toBe("en");
    });
  });

  describe("getCountryFromRequest", () => {
    it("should extract country from dev query param (?geo=VN)", () => {
      const req = new NextRequest("http://localhost:3000/?geo=VN");
      const result = getCountryFromRequest(req);
      expect(result.country).toBe("VN");
      expect(result.source).toBe("query_param");
    });

    it("should extract country from Vercel header (x-vercel-ip-country)", () => {
      const req = new NextRequest("http://localhost:3000/", {
        headers: {
          "x-vercel-ip-country": "VN",
        },
      });
      const result = getCountryFromRequest(req);
      expect(result.country).toBe("VN");
      expect(result.source).toBe("x-vercel-ip-country");
    });

    it("should extract country from Cloudflare header (cf-ipcountry)", () => {
      const req = new NextRequest("http://localhost:3000/", {
        headers: {
          "cf-ipcountry": "SG",
        },
      });
      const result = getCountryFromRequest(req);
      expect(result.country).toBe("SG");
      expect(result.source).toBe("cf-ipcountry");
    });

    it("should ignore invalid/unknown 'XX' country code from Vercel/Cloudflare", () => {
      const req = new NextRequest("http://localhost:3000/", {
        headers: {
          "x-vercel-ip-country": "XX",
          "cf-ipcountry": "XX",
        },
      });
      const result = getCountryFromRequest(req);
      expect(result.country).toBeNull();
      expect(result.source).toBe("none");
    });

    it("should return null country when no geo headers are present", () => {
      const req = new NextRequest("http://localhost:3000/");
      const result = getCountryFromRequest(req);
      expect(result.country).toBeNull();
      expect(result.source).toBe("none");
    });
  });
});
