type Rgb = {
  r: number;
  g: number;
  b: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function normalizeHex(input: string | undefined | null, fallback = "#000000"): string {
  if (!input) {
    return fallback;
  }

  const value = input.trim().toLowerCase();

  if (/^#[0-9a-f]{6}$/.test(value)) {
    return value.toUpperCase();
  }

  if (/^#[0-9a-f]{3}$/.test(value)) {
    const hex = value.slice(1);
    return `#${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`.toUpperCase();
  }

  const rgbMatch = value.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
  if (rgbMatch) {
    return rgbToHex({
      r: clamp(Number(rgbMatch[1]), 0, 255),
      g: clamp(Number(rgbMatch[2]), 0, 255),
      b: clamp(Number(rgbMatch[3]), 0, 255),
    });
  }

  return fallback.toUpperCase();
}

export function hexToRgb(hex: string): Rgb {
  const normalized = normalizeHex(hex);
  return {
    r: Number.parseInt(normalized.slice(1, 3), 16),
    g: Number.parseInt(normalized.slice(3, 5), 16),
    b: Number.parseInt(normalized.slice(5, 7), 16),
  };
}

export function rgbToHex(rgb: Rgb): string {
  const toHex = (value: number) => clamp(Math.round(value), 0, 255).toString(16).padStart(2, "0");
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`.toUpperCase();
}

export function getLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  const channels = [rgb.r, rgb.g, rgb.b].map((value) => {
    const normalized = value / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  });

  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

export function getContrastRatio(foreground: string, background: string): number {
  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return Number((((lighter + 0.05) / (darker + 0.05)) * 100) / 100);
}

export function colorDistance(a: string, b: string): number {
  const rgbA = hexToRgb(a);
  const rgbB = hexToRgb(b);
  return Math.sqrt(
    (rgbA.r - rgbB.r) ** 2 +
      (rgbA.g - rgbB.g) ** 2 +
      (rgbA.b - rgbB.b) ** 2,
  );
}

export function getSaturation(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  if (max === 0) {
    return 0;
  }
  return (max - min) / max;
}

export function mix(hexA: string, hexB: string, amount: number): string {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  const factor = clamp(amount, 0, 1);
  return rgbToHex({
    r: a.r + (b.r - a.r) * factor,
    g: a.g + (b.g - a.g) * factor,
    b: a.b + (b.b - a.b) * factor,
  });
}

export function darken(hex: string, amount: number): string {
  return mix(hex, "#000000", amount);
}

export function lighten(hex: string, amount: number): string {
  return mix(hex, "#FFFFFF", amount);
}

export function ensureContrast(
  foreground: string,
  background: string,
  minimum: number,
): string {
  let candidate = normalizeHex(foreground, "#000000");
  const bg = normalizeHex(background, "#FFFFFF");

  if (getContrastRatio(candidate, bg) >= minimum) {
    return candidate;
  }

  const bgLuminance = getLuminance(bg);
  const direction = bgLuminance > 0.5 ? "#000000" : "#FFFFFF";

  for (let step = 0.1; step <= 1; step += 0.1) {
    candidate = mix(candidate, direction, step);
    if (getContrastRatio(candidate, bg) >= minimum) {
      return candidate;
    }
  }

  return direction.toUpperCase();
}

export function generateNeutralScale(baseBackground: string, baseText: string) {
  const bg = normalizeHex(baseBackground, "#FFFFFF");
  const text = normalizeHex(baseText, "#111111");

  return {
    "0": bg,
    "100": mix(bg, text, 0.06),
    "200": mix(bg, text, 0.12),
    "300": mix(bg, text, 0.2),
    "400": mix(bg, text, 0.32),
    "500": mix(bg, text, 0.45),
    "600": mix(bg, text, 0.58),
    "700": mix(bg, text, 0.7),
    "800": mix(bg, text, 0.82),
    "900": text,
  };
}

export function isDarkColor(hex: string): boolean {
  return getLuminance(hex) < 0.4;
}
