import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { createRemoteJWKSet, jwtVerify } from "jose";
import type { AppEnv } from "../env";

// Cloudflare Access sits in front of /admin and /api/admin and handles login.
// We still verify its signed JWT here so the API can't be reached by bypassing Access
// (e.g. through the workers.dev URL).
const jwksCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

function jwks(teamDomain: string) {
  let set = jwksCache.get(teamDomain);
  if (!set) {
    set = createRemoteJWKSet(new URL(`https://${teamDomain}/cdn-cgi/access/certs`));
    jwksCache.set(teamDomain, set);
  }
  return set;
}

export const requireAccess = createMiddleware<AppEnv>(async (c, next) => {
  if (c.env.DEV_SKIP_AUTH === "true") {
    c.set("adminEmail", "dev@localhost");
    return next();
  }

  const { ACCESS_TEAM_DOMAIN: teamDomain, ACCESS_AUD: aud } = c.env;
  if (!teamDomain || !aud) {
    throw new HTTPException(500, { message: "Cloudflare Access is not configured (ACCESS_TEAM_DOMAIN / ACCESS_AUD)" });
  }

  const token = c.req.header("Cf-Access-Jwt-Assertion");
  if (!token) throw new HTTPException(401, { message: "Missing Cloudflare Access token" });

  try {
    const { payload } = await jwtVerify(token, jwks(teamDomain), {
      issuer: `https://${teamDomain}`,
      audience: aud,
    });
    c.set("adminEmail", String(payload.email ?? ""));
  } catch {
    throw new HTTPException(403, { message: "Invalid Cloudflare Access token" });
  }
  return next();
});
