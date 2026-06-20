import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export type PublicUser = {
  id: string;
  email: string;
  name: string;
};

export type StoredUser = PublicUser & {
  passwordHash: string;
  salt: string;
  createdAt: string;
};

function hashPassword(password: string, salt: string): string {
  return scryptSync(password, salt, 64).toString("hex");
}

export function createPasswordCredentials(password: string): {
  passwordHash: string;
  salt: string;
} {
  const salt = randomBytes(16).toString("hex");
  return { passwordHash: hashPassword(password, salt), salt };
}

export function verifyPassword(
  password: string,
  passwordHash: string,
  salt: string,
): boolean {
  const derived = hashPassword(password, salt);
  try {
    return timingSafeEqual(
      Buffer.from(derived, "hex"),
      Buffer.from(passwordHash, "hex"),
    );
  } catch {
    return false;
  }
}

export function toPublicUser(user: StoredUser | PublicUser): PublicUser {
  return { id: user.id, email: user.email, name: user.name };
}
