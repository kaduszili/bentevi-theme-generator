import { scoreLogoCandidate } from "../utils/dom-heuristics";
import { AssetDiscovery } from "../types/theme";

type PageLike = {
  url(): string;
  title(): Promise<string>;
  evaluate<T>(pageFunction: () => T | Promise<T>): Promise<T>;
};

type RawAssetPayload = {
  faviconCandidates: string[];
  logos: Array<{
    src: string;
    alt: string;
    width: number;
    height: number;
    className: string;
    id: string;
    areaRole: string;
    textHint: string;
    visible: boolean;
  }>;
  brandNameHint: string;
};

function toAbsolute(baseUrl: string, candidate?: string): string {
  if (!candidate) {
    return "";
  }

  try {
    return new URL(candidate, baseUrl).toString();
  } catch {
    return "";
  }
}

export async function discoverAssets(page: PageLike): Promise<AssetDiscovery> {
  const pageUrl = page.url();
  const pageTitle = await page.title().catch(() => "");

  const raw = await page.evaluate<RawAssetPayload>(() => {
    const faviconCandidates = Array.from(
      document.querySelectorAll('link[rel*="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]'),
    )
      .map((node) => node.getAttribute("href") ?? "")
      .filter(Boolean);

    const logoScope = document.querySelector("header, nav, [role='banner'], main, section") ?? document.body;
    const elements = Array.from(logoScope.querySelectorAll("img, svg"));

    const logos = elements.map((element) => {
      const rect = element.getBoundingClientRect();
      const parentText = element.parentElement?.textContent?.trim().slice(0, 120) ?? "";
      const areaRole = element.closest("header, nav, [role='banner'], section, main")?.tagName.toLowerCase() ?? "";

      if (element instanceof HTMLImageElement) {
        return {
          src: element.currentSrc || element.src || "",
          alt: element.alt || "",
          width: rect.width,
          height: rect.height,
          className: element.className || "",
          id: element.id || "",
          areaRole,
          textHint: parentText,
          visible: rect.width > 0 && rect.height > 0,
        };
      }

      if (element instanceof SVGElement) {
        const useHref = element.querySelector("use")?.getAttribute("href") ?? "";
        return {
          src: useHref,
          alt: element.getAttribute("aria-label") ?? "",
          width: rect.width,
          height: rect.height,
          className: element.getAttribute("class") ?? "",
          id: element.id || "",
          areaRole,
          textHint: parentText,
          visible: rect.width > 0 && rect.height > 0,
        };
      }

      return {
        src: "",
        alt: "",
        width: 0,
        height: 0,
        className: "",
        id: "",
        areaRole: "",
        textHint: "",
        visible: false,
      };
    });

    const brandNameHint =
      document.querySelector("meta[property='og:site_name']")?.getAttribute("content") ??
      document.querySelector("meta[name='application-name']")?.getAttribute("content") ??
      document.querySelector("title")?.textContent ??
      "";

    return {
      faviconCandidates,
      logos,
      brandNameHint: brandNameHint.trim(),
    };
  });

  const faviconUrl = raw.faviconCandidates
    .map((candidate) => toAbsolute(pageUrl, candidate))
    .find(Boolean) ?? "";

  const logoUrl = raw.logos
    .map((candidate) => ({
      ...candidate,
      src: toAbsolute(pageUrl, candidate.src),
      score: scoreLogoCandidate(candidate),
    }))
    .sort((a, b) => b.score - a.score)
    .find((candidate) => Boolean(candidate.src))?.src ?? "";

  return {
    pageTitle,
    brandNameHint: raw.brandNameHint || pageTitle,
    faviconUrl,
    logoUrl,
  };
}
