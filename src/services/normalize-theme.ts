import { AiThemeResult, ExtractedColorSignals, ThemeResponse, ThemeScheme } from "../types/theme";
import {
  colorDistance,
  darken,
  ensureContrast,
  generateNeutralScale,
  isDarkColor,
  lighten,
  mix,
  normalizeHex,
} from "../utils/color";

function normalizeRadius(input: string | undefined): string {
  const match = input?.trim().match(/(\d+)(px)?/i);
  if (!match) {
    return "8px";
  }
  return `${Math.max(0, Number(match[1]))}px`;
}

function normalizeFontFamily(input: string | undefined, fallback: string): string {
  const value = input?.trim();
  return value ? value : fallback;
}

function pickDistinctColor(base: string, candidates: string[], fallback: string): string {
  const normalizedBase = normalizeHex(base, fallback);
  const match = candidates
    .map((candidate) => normalizeHex(candidate, fallback))
    .find((candidate) => colorDistance(candidate, normalizedBase) >= 60);
  return match ?? fallback;
}

function ensureSchemeContrast(scheme: ThemeScheme, darkMode: boolean): ThemeScheme {
  const page = normalizeHex(scheme.backgrounds.page, darkMode ? "#0F172A" : "#FFFFFF");
  const surface = normalizeHex(scheme.backgrounds.surface, darkMode ? "#111827" : "#F8FAFC");
  const elevated = normalizeHex(scheme.backgrounds.elevated, darkMode ? "#1F2937" : "#FFFFFF");

  const textPrimary = ensureContrast(
    normalizeHex(scheme.text.primary, darkMode ? "#F8FAFC" : "#111827"),
    page,
    4.5,
  );
  const textSecondary = ensureContrast(
    normalizeHex(scheme.text.secondary, darkMode ? "#CBD5E1" : "#475569"),
    page,
    3,
  );
  const textInverse = ensureContrast(
    normalizeHex(scheme.text.inverse, darkMode ? "#111827" : "#FFFFFF"),
    normalizeHex(scheme.buttons.primaryBg, scheme.brand.primary),
    4.5,
  );

  const primaryBg = normalizeHex(scheme.buttons.primaryBg, scheme.brand.primary);
  const primaryText = ensureContrast(
    normalizeHex(scheme.buttons.primaryText, darkMode ? "#111827" : "#FFFFFF"),
    primaryBg,
    4.5,
  );

  const secondaryBg = normalizeHex(scheme.buttons.secondaryBg, surface);
  const secondaryText = ensureContrast(
    normalizeHex(scheme.buttons.secondaryText, textPrimary),
    secondaryBg,
    4.5,
  );

  const linkDefault = ensureContrast(
    normalizeHex(scheme.links.default, scheme.brand.primary),
    page,
    4.5,
  );
  const linkHover = ensureContrast(
    normalizeHex(scheme.links.hover, darkMode ? lighten(linkDefault, 0.12) : darken(linkDefault, 0.12)),
    page,
    4.5,
  );

  return {
    brand: {
      primary: normalizeHex(scheme.brand.primary, darkMode ? "#60A5FA" : "#2563EB"),
      secondary: normalizeHex(scheme.brand.secondary, darkMode ? "#A78BFA" : "#7C3AED"),
      accent: normalizeHex(scheme.brand.accent, darkMode ? "#34D399" : "#10B981"),
    },
    neutrals: generateNeutralScale(page, textPrimary),
    backgrounds: {
      page,
      surface,
      elevated,
    },
    text: {
      primary: textPrimary,
      secondary: textSecondary,
      inverse: textInverse,
    },
    buttons: {
      primaryBg,
      primaryText,
      secondaryBg,
      secondaryText,
    },
    links: {
      default: linkDefault,
      hover: linkHover,
    },
  };
}

function deriveDarkScheme(light: ThemeScheme): ThemeScheme {
  const page = darken(light.backgrounds.page, 0.92);
  const surface = darken(light.backgrounds.surface, 0.86);
  const elevated = darken(light.backgrounds.elevated, 0.78);
  const primary = isDarkColor(light.brand.primary) ? lighten(light.brand.primary, 0.25) : light.brand.primary;
  const secondary = isDarkColor(light.brand.secondary)
    ? lighten(light.brand.secondary, 0.22)
    : light.brand.secondary;
  const accent = isDarkColor(light.brand.accent) ? lighten(light.brand.accent, 0.18) : light.brand.accent;

  return {
    brand: {
      primary,
      secondary,
      accent,
    },
    neutrals: generateNeutralScale(page, "#F8FAFC"),
    backgrounds: {
      page,
      surface,
      elevated,
    },
    text: {
      primary: "#F8FAFC",
      secondary: "#CBD5E1",
      inverse: "#111827",
    },
    buttons: {
      primaryBg: primary,
      primaryText: ensureContrast("#FFFFFF", primary, 4.5),
      secondaryBg: mix(surface, "#FFFFFF", 0.08),
      secondaryText: "#F8FAFC",
    },
    links: {
      default: primary,
      hover: lighten(primary, 0.12),
    },
  };
}

export function normalizeTheme(args: {
  ai: AiThemeResult;
  assets: {
    faviconUrl: string;
    logoUrl: string;
  };
  brandNameHint: string;
  colors: ExtractedColorSignals;
}): ThemeResponse {
  const lightSource = args.ai.schemes.light;
  const darkSource = args.ai.schemes.dark;

  const normalizedLight = ensureSchemeContrast(lightSource, false);
  let normalizedDark = ensureSchemeContrast(darkSource, true);

  if (colorDistance(normalizedLight.backgrounds.page, normalizedDark.backgrounds.page) < 70) {
    normalizedDark = ensureSchemeContrast(deriveDarkScheme(normalizedLight), true);
  }

  const distinctSecondary = pickDistinctColor(
    normalizedLight.brand.primary,
    [
      normalizedLight.brand.secondary,
      normalizedLight.brand.accent,
      ...args.colors.accents,
      ...args.colors.dominant,
    ],
    mix(normalizedLight.brand.primary, "#FFFFFF", 0.35),
  );

  normalizedLight.brand.secondary = distinctSecondary;
  normalizedDark.brand.secondary = pickDistinctColor(
    normalizedDark.brand.primary,
    [normalizedDark.brand.secondary, normalizedDark.brand.accent, distinctSecondary],
    mix(normalizedDark.brand.primary, "#FFFFFF", 0.3),
  );

  return {
    theme: {
      brandName: args.ai.brandName.trim() || args.brandNameHint || "Unknown Brand",
      assets: {
        faviconUrl: args.assets.faviconUrl,
        logoUrl: args.ai.assets?.useLogoUrl ? args.assets.logoUrl : "",
      },
      radius: {
        base: normalizeRadius(args.ai.radius.base),
      },
      typography: {
        heading: {
          fontFamily: normalizeFontFamily(args.ai.typography.heading.fontFamily, "sans-serif"),
        },
        body: {
          fontFamily: normalizeFontFamily(args.ai.typography.body.fontFamily, "sans-serif"),
        },
      },
      schemes: {
        light: normalizedLight,
        dark: normalizedDark,
      },
    },
    meta: {
      confidence: Math.max(0, Math.min(1, args.ai.confidence)),
      source: "ai+vision+dom",
      version: "v2",
    },
  };
}

export function computeContrastScore(theme: ThemeResponse): number {
  const light = theme.theme.schemes.light;
  const dark = theme.theme.schemes.dark;

  const scores: number[] = [
    light.text.primary,
    light.buttons.primaryText,
    light.links.default,
    dark.text.primary,
    dark.buttons.primaryText,
    dark.links.default,
  ].map((color, index) => {
    const background =
      index < 3
        ? [light.backgrounds.page, light.buttons.primaryBg, light.backgrounds.page][index]
        : [dark.backgrounds.page, dark.buttons.primaryBg, dark.backgrounds.page][index - 3];
    return color === background ? 1 : 0;
  });

  const accessiblePairs: number[] = [
    ensureContrast(light.text.primary, light.backgrounds.page, 4.5) === light.text.primary ? 1 : 0,
    ensureContrast(light.buttons.primaryText, light.buttons.primaryBg, 4.5) === light.buttons.primaryText ? 1 : 0,
    ensureContrast(dark.text.primary, dark.backgrounds.page, 4.5) === dark.text.primary ? 1 : 0,
    ensureContrast(dark.buttons.primaryText, dark.buttons.primaryBg, 4.5) === dark.buttons.primaryText ? 1 : 0,
  ];

  const penalties = Number((accessiblePairs.reduce((sum, value) => sum + value, 0) / 4).toFixed(2));

  return Number(Math.max(0, penalties - scores.reduce((sum, value) => sum + value, 0) * 0.1).toFixed(2));
}
