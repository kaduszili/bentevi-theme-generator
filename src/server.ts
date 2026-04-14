import Fastify from "fastify";
import { getEnv } from "./config/env";
import { registerHealthRoute } from "./routes/health";
import { registerThemeRoute } from "./routes/theme";

export function buildServer() {
  const app = Fastify({
    logger: true,
  });

  registerHealthRoute(app);
  registerThemeRoute(app);

  return app;
}

async function start(): Promise<void> {
  const env = getEnv();
  const app = buildServer();

  try {
    await app.listen({
      host: "0.0.0.0",
      port: env.port,
    });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

if (require.main === module) {
  void start();
}
