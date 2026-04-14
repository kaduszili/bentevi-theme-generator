import test from "node:test";
import assert from "node:assert/strict";
import { normalizeTheme } from "./normalize-theme";
import { AiThemeResult, ExtractedColorSignals } from "../types/theme";
import { getContrastRatio } from "../utils/color";

const colors: ExtractedColorSignals = {
  dominant: ["#3366FF", "#FFFFFF", "#111111", "#22C55E"],
  neutrals: ["#FFFFFF", "#111111"],
  backgrounds: ["#FFFFFF", "#F8FAFC"],
  accents: ["#3366FF", "#22C55E"],
};

const aiResult: AiThemeResult = {
  brandName: "Acme",
  radius: { base: "12px" },
  typography: {
    heading: { fontFamily: "" },
    body: { fontFamily: "" },
  },
  schemes: {
    light: {
      brand: {
        primary: "#3366FF",
        secondary: "#3366FF",
        accent: "#22C55E",
      },
      neutrals: {
        "0": "#FFFFFF",
        "100": "#F8FAFC",
        "200": "#E2E8F0",
        "300": "#CBD5E1",
        "400": "#94A3B8",
        "500": "#64748B",
        "600": "#475569",
        "700": "#334155",
        "800": "#1E293B",
        "900": "#0F172A",
      },
      backgrounds: {
        page: "#FFFFFF",
        surface: "#F8FAFC",
        elevated: "#FFFFFF",
      },
      text: {
        primary: "#111111",
        secondary: "#666666",
        inverse: "#FFFFFF",
      },
      buttons: {
        primaryBg: "#3366FF",
        primaryText: "#FFFFFF",
        secondaryBg: "#F8FAFC",
        secondaryText: "#111111",
      },
      links: {
        default: "#3366FF",
        hover: "#254EDB",
      },
    },
    dark: {
      brand: {
        primary: "#3366FF",
        secondary: "#3366FF",
        accent: "#22C55E",
      },
      neutrals: {
        "0": "#FFFFFF",
        "100": "#F8FAFC",
        "200": "#E2E8F0",
        "300": "#CBD5E1",
        "400": "#94A3B8",
        "500": "#64748B",
        "600": "#475569",
        "700": "#334155",
        "800": "#1E293B",
        "900": "#0F172A",
      },
      backgrounds: {
        page: "#FFFFFF",
        surface: "#F8FAFC",
        elevated: "#FFFFFF",
      },
      text: {
        primary: "#111111",
        secondary: "#666666",
        inverse: "#FFFFFF",
      },
      buttons: {
        primaryBg: "#3366FF",
        primaryText: "#FFFFFF",
        secondaryBg: "#F8FAFC",
        secondaryText: "#111111",
      },
      links: {
        default: "#3366FF",
        hover: "#254EDB",
      },
    },
  },
  confidence: 0.82,
  assets: {
    useLogoUrl: true,
  },
};

test("normalizeTheme returns accessible light and dark schemes", () => {
  const result = normalizeTheme({
    ai: aiResult,
    assets: {
      faviconUrl: "https://example.com/favicon.ico",
      logoUrl: "https://example.com/logo.svg",
    },
    brandNameHint: "Acme",
    colors,
  });

  assert.equal(result.theme.radius.base, "12px");
  assert.equal(result.theme.typography.heading.fontFamily, "sans-serif");
  assert.equal(result.theme.assets.logoUrl, "https://example.com/logo.svg");
  assert.notEqual(
    result.theme.schemes.light.brand.primary,
    result.theme.schemes.light.brand.secondary,
  );
  assert.ok(
    getContrastRatio(
      result.theme.schemes.light.text.primary,
      result.theme.schemes.light.backgrounds.page,
    ) >= 4.5,
  );
  assert.ok(
    getContrastRatio(
      result.theme.schemes.dark.text.primary,
      result.theme.schemes.dark.backgrounds.page,
    ) >= 4.5,
  );
});
