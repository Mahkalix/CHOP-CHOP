import { createRemoteJWKSet, errors, jwtVerify } from "jose";
import type { preHandlerAsyncHookHandler } from "fastify";

declare module "fastify" {
  interface FastifyRequest {
    /** Id of the authenticated Supabase user, set by the auth guard. */
    userId: string;
  }
}

/** Returns the user id (the JWT `sub`) for a valid access token, or null. */
export type Authenticate = (token: string) => Promise<string | null>;

/**
 * Verifies Supabase Auth access tokens against the project's public signing keys (JWKS),
 * so no secret is needed on the API side.
 */
export function createSupabaseAuthenticator(supabaseUrl: string): Authenticate {
  const issuer = `${supabaseUrl}/auth/v1`;
  const jwks = createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks.json`));
  return async (token) => {
    try {
      const { payload } = await jwtVerify(token, jwks, {
        issuer,
        audience: "authenticated",
        algorithms: ["ES256", "RS256"],
      });
      // Anonymous sign-ins carry a valid token too: only real accounts may play.
      if (payload.role !== "authenticated" || payload.is_anonymous === true) return null;
      return typeof payload.sub === "string" ? payload.sub : null;
    } catch (err) {
      // An invalid token is a 401; an unreachable JWKS is an outage and must not look like one.
      if (err instanceof errors.JOSEError && !(err instanceof errors.JWKSTimeout)) return null;
      throw err;
    }
  };
}

export function authGuard(authenticate: Authenticate): preHandlerAsyncHookHandler {
  return async (request, reply) => {
    const header = request.headers.authorization ?? "";
    const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
    const userId = token ? await authenticate(token) : null;
    if (!userId) {
      return reply.code(401).send({ error: "Unauthorized" });
    }
    request.userId = userId;
  };
}
