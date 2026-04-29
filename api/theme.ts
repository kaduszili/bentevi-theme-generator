import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getEnv } from "../src/config/env";
import { runThemeExtraction } from "../src/handlers/theme";
import { ThemeRequestBody } from "../src/types/theme";

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  const provided = req.headers["x-api-key"];
  const apiKeyHeader = Array.isArray(provided) ? provided[0] : provided;
  if (!apiKeyHeader || apiKeyHeader !== getEnv().apiKey) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }

  const body = (typeof req.body === "string" ? safeParse(req.body) : req.body) as
    | ThemeRequestBody
    | null;
  if (!body || typeof body.url !== "string" || body.url.length === 0) {
    res.status(400).json({ error: "invalid_body" });
    return;
  }

  const result = await runThemeExtraction(body);
  res.status(result.status).json(result.body);
}

function safeParse(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
