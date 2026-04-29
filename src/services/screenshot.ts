import type { LaunchOptions } from "playwright-core";
import { chromium } from "playwright-core";
import { discoverAssets } from "./asset-discovery";
import { ScreenshotResult } from "../types/theme";

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

const isServerless = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME;

async function getLaunchOptions(): Promise<LaunchOptions> {
  if (isServerless) {
    const sparticuz = (await import("@sparticuz/chromium")).default;
    return {
      args: sparticuz.args,
      executablePath: await sparticuz.executablePath(),
      headless: true,
    };
  }
  return {
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  };
}

export async function captureWebsite(url: string): Promise<ScreenshotResult> {
  const browser = await chromium.launch(await getLaunchOptions());

  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      userAgent: USER_AGENT,
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();

    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });

    const assets = await discoverAssets(page);

    await page.route("**/*", async (route) => {
      const resourceType = route.request().resourceType();
      if (resourceType === "image" || resourceType === "font" || resourceType === "media") {
        await route.abort();
        return;
      }
      await route.continue();
    });

    await page.reload({
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });

    const image = await page.screenshot({
      fullPage: true,
      type: "png",
    });

    await context.close();

    return {
      image,
      pageTitle: assets.pageTitle,
      brandNameHint: assets.brandNameHint,
      faviconUrl: assets.faviconUrl,
      logoUrl: assets.logoUrl,
    };
  } finally {
    await browser.close();
  }
}
