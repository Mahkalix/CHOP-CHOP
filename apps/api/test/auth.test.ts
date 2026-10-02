import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { exportJWK, generateKeyPair, SignJWT, type JWK } from "jose";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createSupabaseAuthenticator, type Authenticate } from "../src/auth.js";

describe("Supabase token verification", () => {
  let server: Server;
  let baseUrl: string;
  let authenticate: Authenticate;
  let privateKey: CryptoKey;
  let otherKey: CryptoKey;

  const sign = (claims: Record<string, unknown>, opts: { key?: CryptoKey; iss?: string; aud?: string; exp?: string } = {}) =>
    new SignJWT(claims)
      .setProtectedHeader({ alg: "ES256", kid: "k1" })
      .setSubject("user-1")
      .setIssuer(opts.iss ?? `${baseUrl}/auth/v1`)
      .setAudience(opts.aud ?? "authenticated")
      .setExpirationTime(opts.exp ?? "5m")
      .sign(opts.key ?? privateKey);

  beforeAll(async () => {
    const pair = await generateKeyPair("ES256");
    privateKey = pair.privateKey;
    otherKey = (await generateKeyPair("ES256")).privateKey;
    const jwk: JWK = { ...(await exportJWK(pair.publicKey)), kid: "k1", alg: "ES256", use: "sig" };
    server = createServer((_req, res) => {
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ keys: [jwk] }));
    });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    authenticate = createSupabaseAuthenticator(baseUrl);
  });
  afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));

  it("returns the user id of a valid token", async () => {
    expect(await authenticate(await sign({ role: "authenticated" }))).toBe("user-1");
  });

  it.each([
    ["signed with another key", () => sign({ role: "authenticated" }, { key: otherKey })],
    ["wrong issuer", () => sign({ role: "authenticated" }, { iss: "https://evil.example/auth/v1" })],
    ["wrong audience", () => sign({ role: "authenticated" }, { aud: "anon" })],
    ["expired", () => sign({ role: "authenticated" }, { exp: "-1m" })],
    ["anonymous account", () => sign({ role: "authenticated", is_anonymous: true })],
    ["not the authenticated role", () => sign({ role: "service_role" })],
    ["garbage", async () => "not.a.jwt"],
  ])("rejects a token that is %s", async (_label, make) => {
    expect(await authenticate(await make())).toBeNull();
  });
});
