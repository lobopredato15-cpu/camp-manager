import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "cam_session";

type SessionPayload = {
  userId: string;
  username: string;
  role: string;
  organizationId: string;
  issuedAt: number;
};

function secret() {
  const value = process.env.AUTH_COOKIE_SECRET || process.env.SUPABASE_JWT_SECRET;
  if (!value) {
    throw new Error("AUTH_COOKIE_SECRET or SUPABASE_JWT_SECRET is required");
  }
  return value;
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function createSessionToken(payload: Omit<SessionPayload, "issuedAt">) {
  const body = Buffer.from(JSON.stringify({ ...payload, issuedAt: Date.now() }), "utf8").toString("base64url");
  return `${body}.${sign(body)}`;
}

export function verifySessionToken(token: string | undefined): SessionPayload | null {
  if (!token) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  const expected = sign(body);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SessionPayload;
  } catch {
    return null;
  }
}
