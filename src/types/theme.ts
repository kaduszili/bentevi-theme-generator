export type ThemeRequestBody = {
  url: string;
};

export type ThemeColorScale = {
  "0": string;
  "100": string;
  "200": string;
  "300": string;
  "400": string;
  "500": string;
  "600": string;
  "700": string;
  "800": string;
  "900": string;
};

export type ThemeScheme = {
  brand: {
    primary: string;
    secondary: string;
    accent: string;
  };
  neutrals: ThemeColorScale;
  backgrounds: {
    page: string;
    surface: string;
    elevated: string;
  };
  text: {
    primary: string;
    secondary: string;
    inverse: string;
  };
  buttons: {
    primaryBg: string;
    primaryText: string;
    secondaryBg: string;
    secondaryText: string;
  };
  links: {
    default: string;
    hover: string;
  };
};

export type ThemeResponse = {
  theme: {
    brandName: string;
    assets: {
      faviconUrl: string;
      logoUrl: string;
    };
    radius: {
      base: string;
    };
    typography: {
      heading: {
        fontFamily: string;
      };
      body: {
        fontFamily: string;
      };
    };
    schemes: {
      light: ThemeScheme;
      dark: ThemeScheme;
    };
  };
  meta: {
    confidence: number;
    source: "ai+vision+dom";
    version: "v2";
  };
};

export type AssetDiscovery = {
  pageTitle: string;
  brandNameHint: string;
  faviconUrl: string;
  logoUrl: string;
};

export type ScreenshotResult = {
  image: Buffer;
  pageTitle: string;
  brandNameHint: string;
  faviconUrl: string;
  logoUrl: string;
};

export type ExtractedColorSignals = {
  dominant: string[];
  neutrals: string[];
  backgrounds: string[];
  accents: string[];
};

export type AiThemeResult = {
  brandName: string;
  radius: {
    base: string;
  };
  typography: {
    heading: {
      fontFamily: string;
    };
    body: {
      fontFamily: string;
    };
  };
  schemes: {
    light: ThemeScheme;
    dark: ThemeScheme;
  };
  confidence: number;
  assets?: {
    useLogoUrl?: boolean;
  };
};

export type ThemeExtractionLog = {
  url: string;
  timestamp: string;
  timings: {
    screenshot: number;
    ai: number;
    total: number;
  };
  input: {
    colors: string[];
  };
  output: {
    primary: string;
    secondary: string;
  };
  quality: {
    contrastScore: number;
    confidence: number;
  };
  status: "success" | "error";
  error: string | null;
};
