import { PNG } from "pngjs";
import { ExtractedColorSignals } from "../types/theme";
import { getSaturation, hexToRgb, normalizeHex, rgbToHex } from "../utils/color";

type Bucket = {
  count: number;
  r: number;
  g: number;
  b: number;
};

function bucketKey(r: number, g: number, b: number): string {
  const quantize = (value: number) => Math.floor(value / 32) * 32;
  return `${quantize(r)}-${quantize(g)}-${quantize(b)}`;
}

function sortUniqueByDistance(colors: string[], minimumDistance: number): string[] {
  const result: string[] = [];
  for (const color of colors) {
    if (!result.some((existing) => {
      const a = hexToRgb(existing);
      const b = hexToRgb(color);
      const distance = Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2);
      return distance < minimumDistance;
    })) {
      result.push(color);
    }
  }
  return result;
}

export function extractColorSignals(imageBuffer: Buffer): ExtractedColorSignals {
  const png = PNG.sync.read(imageBuffer);
  const buckets = new Map<string, Bucket>();

  for (let y = 0; y < png.height; y += 4) {
    for (let x = 0; x < png.width; x += 4) {
      const index = (png.width * y + x) << 2;
      const alpha = png.data[index + 3];
      if (alpha < 200) {
        continue;
      }

      const r = png.data[index];
      const g = png.data[index + 1];
      const b = png.data[index + 2];

      const key = bucketKey(r, g, b);
      const current = buckets.get(key) ?? { count: 0, r: 0, g: 0, b: 0 };
      current.count += 1;
      current.r += r;
      current.g += g;
      current.b += b;
      buckets.set(key, current);
    }
  }

  const colors = Array.from(buckets.values())
    .sort((a, b) => b.count - a.count)
    .map((bucket) =>
      rgbToHex({
        r: bucket.r / bucket.count,
        g: bucket.g / bucket.count,
        b: bucket.b / bucket.count,
      }),
    );

  const unique = sortUniqueByDistance(colors.map((value) => normalizeHex(value)), 28).slice(0, 8);
  const neutrals = unique.filter((color) => getSaturation(color) < 0.15).slice(0, 4);
  const accents = unique.filter((color) => getSaturation(color) >= 0.25).slice(0, 4);
  const backgrounds = unique
    .filter((color) => {
      const { r, g, b } = hexToRgb(color);
      return (r + g + b) / 3 > 120;
    })
    .slice(0, 4);

  return {
    dominant: unique,
    neutrals: neutrals.length > 0 ? neutrals : unique.slice(0, 2),
    backgrounds: backgrounds.length > 0 ? backgrounds : unique.slice(0, 2),
    accents: accents.length > 0 ? accents : unique.slice(0, 3),
  };
}
