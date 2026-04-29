import { ThemeRequestBody, ThemeResponse, ThemeExtractionLog } from "../types/theme";
import { captureWebsite } from "../services/screenshot";
import { extractColorSignals } from "../services/color-extractor";
import { inferThemeWithAi } from "../services/style-ai";
import { computeContrastScore, normalizeTheme } from "../services/normalize-theme";
import { logJson } from "../utils/logger";

export type ThemeHandlerResult =
  | { ok: true; status: 200; body: ThemeResponse }
  | { ok: false; status: 400 | 502 | 504 | 500; body: { error: string } };

function validateUrl(rawUrl: string): URL | null {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function runThemeExtraction(body: ThemeRequestBody): Promise<ThemeHandlerResult> {
  const startedAt = Date.now();
  const parsedUrl = validateUrl(body.url);

  if (!parsedUrl) {
    return { ok: false, status: 400, body: { error: "invalid_url" } };
  }

  const logPayload: ThemeExtractionLog = {
    url: parsedUrl.toString(),
    timestamp: new Date().toISOString(),
    timings: { screenshot: 0, ai: 0, total: 0 },
    input: { colors: [] },
    output: { primary: "", secondary: "" },
    quality: { contrastScore: 0, confidence: 0 },
    status: "error",
    error: null,
  };

  try {
    const screenshotStartedAt = Date.now();
    const screenshot = await captureWebsite(parsedUrl.toString());
    logPayload.timings.screenshot = Date.now() - screenshotStartedAt;

    const colors = extractColorSignals(screenshot.image);
    logPayload.input.colors = colors.dominant;

    const aiStartedAt = Date.now();
    const ai = await inferThemeWithAi({
      screenshotBase64: screenshot.image.toString("base64"),
      url: parsedUrl.toString(),
      pageTitle: screenshot.pageTitle,
      brandNameHint: screenshot.brandNameHint,
      faviconUrl: screenshot.faviconUrl,
      logoUrl: screenshot.logoUrl,
      colors,
    });
    logPayload.timings.ai = Date.now() - aiStartedAt;

    const response = normalizeTheme({
      ai,
      assets: {
        faviconUrl: screenshot.faviconUrl,
        logoUrl: screenshot.logoUrl,
      },
      brandNameHint: screenshot.brandNameHint,
      colors,
    });

    logPayload.timings.total = Date.now() - startedAt;
    logPayload.output.primary = response.theme.schemes.light.brand.primary;
    logPayload.output.secondary = response.theme.schemes.light.brand.secondary;
    logPayload.quality.contrastScore = computeContrastScore(response);
    logPayload.quality.confidence = response.meta.confidence;
    logPayload.status = "success";
    logJson(logPayload);

    return { ok: true, status: 200, body: response };
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown_error";
    logPayload.timings.total = Date.now() - startedAt;
    logPayload.error = message;
    logJson(logPayload);

    if (/timeout/i.test(message)) {
      return { ok: false, status: 504, body: { error: "screenshot_timeout" } };
    }
    if (/OpenAI returned/i.test(message)) {
      return { ok: false, status: 502, body: { error: "ai_upstream_error" } };
    }
    return { ok: false, status: 500, body: { error: "internal_error" } };
  }
}
