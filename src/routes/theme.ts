import { FastifyInstance } from "fastify";
import { themeRequestSchema, themeResponseSchema } from "../schemas/theme";
import { ThemeRequestBody, ThemeResponse, ThemeExtractionLog } from "../types/theme";
import { validateApiKey } from "../middleware/apiKey";
import { captureWebsite } from "../services/screenshot";
import { extractColorSignals } from "../services/color-extractor";
import { inferThemeWithAi } from "../services/style-ai";
import { computeContrastScore, normalizeTheme } from "../services/normalize-theme";
import { logJson } from "../utils/logger";

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

export function registerThemeRoute(app: FastifyInstance): void {
  app.post<{ Body: ThemeRequestBody; Reply: ThemeResponse | { error: string } }>(
    "/theme",
    {
      schema: {
        body: themeRequestSchema,
        response: {
          200: themeResponseSchema,
        },
      },
      preHandler: validateApiKey,
    },
    async (request, reply) => {
      const startedAt = Date.now();
      const parsedUrl = validateUrl(request.body.url);

      if (!parsedUrl) {
        return reply.code(400).send({ error: "invalid_url" });
      }

      const logPayload: ThemeExtractionLog = {
        url: parsedUrl.toString(),
        timestamp: new Date().toISOString(),
        timings: {
          screenshot: 0,
          ai: 0,
          total: 0,
        },
        input: {
          colors: [],
        },
        output: {
          primary: "",
          secondary: "",
        },
        quality: {
          contrastScore: 0,
          confidence: 0,
        },
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

        return reply.send(response);
      } catch (error) {
        const message = error instanceof Error ? error.message : "unknown_error";
        logPayload.timings.total = Date.now() - startedAt;
        logPayload.error = message;
        logJson(logPayload);

        if (/timeout/i.test(message)) {
          return reply.code(504).send({ error: "screenshot_timeout" });
        }

        if (/OpenAI returned/i.test(message)) {
          return reply.code(502).send({ error: "ai_upstream_error" });
        }

        request.log.error({ err: error }, "Theme extraction failed");
        return reply.code(500).send({ error: "internal_error" });
      }
    },
  );
}
