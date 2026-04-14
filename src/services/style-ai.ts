import OpenAI from "openai";
import { getEnv } from "../config/env";
import { AiThemeResult, ExtractedColorSignals } from "../types/theme";

let openaiClient: OpenAI | null = null;

function getOpenAiClient(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: getEnv().openAiApiKey,
    });
  }

  return openaiClient;
}

const SYSTEM_PROMPT = [
  "You are a senior product designer.",
  "You analyze website visuals and extract a clean and usable design system.",
  "Use visible UI as source of truth.",
  "Prefer dominant colors.",
  "Avoid guessing beyond the evidence.",
  "Ensure readable contrast.",
  "Avoid similar colors when assigning distinct roles.",
  "Return ONLY valid JSON that matches the requested schema.",
].join(" ");

const AI_RESPONSE_SCHEMA = {
  name: "theme_extraction_v2",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["brandName", "radius", "typography", "schemes", "confidence", "assets"],
    properties: {
      brandName: { type: "string" },
      radius: {
        type: "object",
        additionalProperties: false,
        required: ["base"],
        properties: {
          base: { type: "string" },
        },
      },
      typography: {
        type: "object",
        additionalProperties: false,
        required: ["heading", "body"],
        properties: {
          heading: {
            type: "object",
            additionalProperties: false,
            required: ["fontFamily"],
            properties: {
              fontFamily: { type: "string" },
            },
          },
          body: {
            type: "object",
            additionalProperties: false,
            required: ["fontFamily"],
            properties: {
              fontFamily: { type: "string" },
            },
          },
        },
      },
      schemes: {
        type: "object",
        additionalProperties: false,
        required: ["light", "dark"],
        properties: {
          light: { $ref: "#/$defs/scheme" },
          dark: { $ref: "#/$defs/scheme" },
        },
      },
      confidence: { type: "number" },
      assets: {
        type: "object",
        additionalProperties: false,
        required: ["useLogoUrl"],
        properties: {
          useLogoUrl: { type: "boolean" },
        },
      },
    },
    $defs: {
      scale: {
        type: "object",
        additionalProperties: false,
        required: ["0", "100", "200", "300", "400", "500", "600", "700", "800", "900"],
        properties: {
          "0": { type: "string" },
          "100": { type: "string" },
          "200": { type: "string" },
          "300": { type: "string" },
          "400": { type: "string" },
          "500": { type: "string" },
          "600": { type: "string" },
          "700": { type: "string" },
          "800": { type: "string" },
          "900": { type: "string" },
        },
      },
      scheme: {
        type: "object",
        additionalProperties: false,
        required: ["brand", "neutrals", "backgrounds", "text", "buttons", "links"],
        properties: {
          brand: {
            type: "object",
            additionalProperties: false,
            required: ["primary", "secondary", "accent"],
            properties: {
              primary: { type: "string" },
              secondary: { type: "string" },
              accent: { type: "string" },
            },
          },
          neutrals: { $ref: "#/$defs/scale" },
          backgrounds: {
            type: "object",
            additionalProperties: false,
            required: ["page", "surface", "elevated"],
            properties: {
              page: { type: "string" },
              surface: { type: "string" },
              elevated: { type: "string" },
            },
          },
          text: {
            type: "object",
            additionalProperties: false,
            required: ["primary", "secondary", "inverse"],
            properties: {
              primary: { type: "string" },
              secondary: { type: "string" },
              inverse: { type: "string" },
            },
          },
          buttons: {
            type: "object",
            additionalProperties: false,
            required: ["primaryBg", "primaryText", "secondaryBg", "secondaryText"],
            properties: {
              primaryBg: { type: "string" },
              primaryText: { type: "string" },
              secondaryBg: { type: "string" },
              secondaryText: { type: "string" },
            },
          },
          links: {
            type: "object",
            additionalProperties: false,
            required: ["default", "hover"],
            properties: {
              default: { type: "string" },
              hover: { type: "string" },
            },
          },
        },
      },
    },
  },
} as const;

export async function inferThemeWithAi(input: {
  screenshotBase64: string;
  url: string;
  pageTitle: string;
  brandNameHint: string;
  faviconUrl: string;
  logoUrl: string;
  colors: ExtractedColorSignals;
}): Promise<AiThemeResult> {
  const userPrompt = [
    "Analyze this website and extract a styleguide.",
    "Produce both light and dark variants, even if the page only visibly shows one scheme.",
    "Derive the missing scheme as a faithful variation of the observed visual language.",
    "Keep brand colors stable across both schemes unless contrast forces adjustment.",
    `URL: ${input.url}`,
    `Page title: ${input.pageTitle}`,
    `Brand hint: ${input.brandNameHint}`,
    `Detected favicon URL: ${input.faviconUrl || "(none)"}`,
    `Detected logo URL: ${input.logoUrl || "(none)"}`,
    `Detected dominant colors: ${input.colors.dominant.join(", ")}`,
    `Detected neutrals: ${input.colors.neutrals.join(", ")}`,
    `Detected backgrounds: ${input.colors.backgrounds.join(", ")}`,
    `Detected accents: ${input.colors.accents.join(", ")}`,
    "Tasks:",
    "1. Infer the brand name.",
    "2. Infer grouped theme roles for light and dark schemes.",
    "3. Infer one heading font family label and one body font family label.",
    "4. Infer a base border radius value like 4px, 8px, 12px, or 16px.",
    "5. Decide whether the detected logo URL appears to be the primary brand logo.",
    "Return only JSON matching the schema.",
  ].join("\n");

  const completion = await getOpenAiClient().chat.completions.create({
    model: "gpt-4o",
    response_format: {
      type: "json_schema",
      json_schema: AI_RESPONSE_SCHEMA,
    } as never,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          { type: "text", text: userPrompt },
          {
            type: "image_url",
            image_url: {
              url: `data:image/png;base64,${input.screenshotBase64}`,
              detail: "high",
            },
          },
        ],
      },
    ],
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI returned an empty response");
  }

  try {
    return JSON.parse(content) as AiThemeResult;
  } catch {
    throw new Error("OpenAI returned malformed JSON");
  }
}
