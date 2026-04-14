import { FastifyReply, FastifyRequest } from "fastify";
import { getEnv } from "../config/env";

export async function validateApiKey(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const provided = request.headers["x-api-key"];
  const value = Array.isArray(provided) ? provided[0] : provided;

  if (!value || value !== getEnv().apiKey) {
    await reply.code(401).send({ error: "unauthorized" });
  }
}
