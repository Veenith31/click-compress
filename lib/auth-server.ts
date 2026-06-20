import {
  createHmac,
  timingSafeEqual,
} from "node:crypto";
import { cookies } from "next/headers";
import {
  authenticateUserDb,
  createUserDb,
  findUserByIdDb,
} from "@/lib/auth/db-store";
import {
  authenticateUserLocal,
  createUserLocal,
  findUserByIdLocal,
} from "@/lib/auth/local-store";
import { authSecret, usePostgres } from "@/lib/env";

export type { PublicUser, StoredUser } from "@/lib/auth/crypto";
export {
  createPasswordCredentials,
  toPublicUser,
  verifyPassword,
} from "@/lib/auth/crypto";

export const SESSION_COOKIE = "sc_session";
const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 7;

function signSession(payload: string): string {
  return createHmac("sha256", authSecret()).update(payload).digest("hex");
}

function createSessionToken(userId: string): string {
  const exp = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SEC;
  const payload = `${userId}.${exp}`;
  const sig = signSession(payload);
  return `${payload}.${sig}`;
}

async function resolveUserFromSession(userId: string) {
  if (usePostgres()) {
    return findUserByIdDb(userId);
  }
  return findUserByIdLocal(userId);
}

async function parseSessionToken(token: string | undefined) {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [userId, expStr, sig] = parts;
  const payload = `${userId}.${expStr}`;
  const expected = signSession(payload);
  try {
    if (
      !timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"))
    ) {
      return null;
    }
  } catch {
    return null;
  }

  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) {
    return null;
  }

  return resolveUserFromSession(userId);
}

export async function getSessionUser() {
  const jar = await cookies();
  return parseSessionToken(jar.get(SESSION_COOKIE)?.value);
}

export async function setSessionCookie(userId: string): Promise<void> {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, createSessionToken(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SEC,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export async function createUser(input: {
  email: string;
  name: string;
  password: string;
}) {
  if (usePostgres()) {
    return createUserDb(input);
  }
  return createUserLocal(input);
}

export async function authenticateUser(email: string, password: string) {
  if (usePostgres()) {
    return authenticateUserDb(email, password);
  }
  return authenticateUserLocal(email, password);
}
