import dotenv from "dotenv";

dotenv.config();

type Env = {
  port: number;
  apiKey: string;
  openAiApiKey: string;
};

let cachedEnv: Env | null = null;

export function getEnv(): Env {
  if (cachedEnv) {
    return cachedEnv;
  }

  const apiKey = process.env.API_KEY;
  const openAiApiKey = process.env.OPENAI_API_KEY;
  const port = Number(process.env.PORT ?? 3000);

  if (!apiKey) {
    throw new Error("Missing required env var API_KEY");
  }

  if (!openAiApiKey) {
    throw new Error("Missing required env var OPENAI_API_KEY");
  }

  cachedEnv = {
    port,
    apiKey,
    openAiApiKey,
  };

  return cachedEnv;
}
