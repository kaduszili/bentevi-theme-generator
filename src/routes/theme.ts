import { FastifyInstance } from "fastify";
import { themeRequestSchema, themeResponseSchema } from "../schemas/theme";
import { ThemeRequestBody, ThemeResponse } from "../types/theme";
import { validateApiKey } from "../middleware/apiKey";
import { runThemeExtraction } from "../handlers/theme";

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
      const result = await runThemeExtraction(request.body);
      if (!result.ok && result.status === 500) {
        request.log.error("Theme extraction failed");
      }
      return reply.code(result.status).send(result.body);
    },
  );
}
