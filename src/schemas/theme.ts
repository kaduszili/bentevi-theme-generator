export const themeRequestSchema = {
  type: "object",
  required: ["url"],
  additionalProperties: false,
  properties: {
    url: { type: "string", minLength: 1 },
  },
} as const;

const colorScaleSchema = {
  type: "object",
  required: ["0", "100", "200", "300", "400", "500", "600", "700", "800", "900"],
  additionalProperties: false,
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
} as const;

const schemeSchema = {
  type: "object",
  required: ["brand", "neutrals", "backgrounds", "text", "buttons", "links"],
  additionalProperties: false,
  properties: {
    brand: {
      type: "object",
      required: ["primary", "secondary", "accent"],
      additionalProperties: false,
      properties: {
        primary: { type: "string" },
        secondary: { type: "string" },
        accent: { type: "string" },
      },
    },
    neutrals: colorScaleSchema,
    backgrounds: {
      type: "object",
      required: ["page", "surface", "elevated"],
      additionalProperties: false,
      properties: {
        page: { type: "string" },
        surface: { type: "string" },
        elevated: { type: "string" },
      },
    },
    text: {
      type: "object",
      required: ["primary", "secondary", "inverse"],
      additionalProperties: false,
      properties: {
        primary: { type: "string" },
        secondary: { type: "string" },
        inverse: { type: "string" },
      },
    },
    buttons: {
      type: "object",
      required: ["primaryBg", "primaryText", "secondaryBg", "secondaryText"],
      additionalProperties: false,
      properties: {
        primaryBg: { type: "string" },
        primaryText: { type: "string" },
        secondaryBg: { type: "string" },
        secondaryText: { type: "string" },
      },
    },
    links: {
      type: "object",
      required: ["default", "hover"],
      additionalProperties: false,
      properties: {
        default: { type: "string" },
        hover: { type: "string" },
      },
    },
  },
} as const;

export const themeResponseSchema = {
  type: "object",
  required: ["theme", "meta"],
  additionalProperties: false,
  properties: {
    theme: {
      type: "object",
      required: ["brandName", "assets", "radius", "typography", "schemes"],
      additionalProperties: false,
      properties: {
        brandName: { type: "string" },
        assets: {
          type: "object",
          required: ["faviconUrl", "logoUrl"],
          additionalProperties: false,
          properties: {
            faviconUrl: { type: "string" },
            logoUrl: { type: "string" },
          },
        },
        radius: {
          type: "object",
          required: ["base"],
          additionalProperties: false,
          properties: {
            base: { type: "string" },
          },
        },
        typography: {
          type: "object",
          required: ["heading", "body"],
          additionalProperties: false,
          properties: {
            heading: {
              type: "object",
              required: ["fontFamily"],
              additionalProperties: false,
              properties: {
                fontFamily: { type: "string" },
              },
            },
            body: {
              type: "object",
              required: ["fontFamily"],
              additionalProperties: false,
              properties: {
                fontFamily: { type: "string" },
              },
            },
          },
        },
        schemes: {
          type: "object",
          required: ["light", "dark"],
          additionalProperties: false,
          properties: {
            light: schemeSchema,
            dark: schemeSchema,
          },
        },
      },
    },
    meta: {
      type: "object",
      required: ["confidence", "source", "version"],
      additionalProperties: false,
      properties: {
        confidence: { type: "number" },
        source: { type: "string" },
        version: { type: "string" },
      },
    },
  },
} as const;
