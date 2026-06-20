import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import {
  createPasswordCredentials,
  toPublicUser,
  verifyPassword,
  type PublicUser,
} from "@/lib/auth/crypto";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";

export async function findUserByEmailDb(
  email: string,
): Promise<(PublicUser & { passwordHash: string; salt: string }) | null> {
  const normalized = email.trim().toLowerCase();
  const rows = await getDb()
    .select()
    .from(users)
    .where(eq(users.email, normalized))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    passwordHash: row.passwordHash,
    salt: row.salt,
  };
}

export async function findUserByIdDb(userId: string): Promise<PublicUser | null> {
  const rows = await getDb()
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return rows[0] ?? null;
}

export async function createUserDb(input: {
  email: string;
  name: string;
  password: string;
}): Promise<PublicUser> {
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();

  if (!email || !email.includes("@")) {
    throw new Error("Enter a valid email address.");
  }
  if (name.length < 2) {
    throw new Error("Name must be at least 2 characters.");
  }
  if (input.password.length < 6) {
    throw new Error("Password must be at least 6 characters.");
  }

  const existing = await findUserByEmailDb(email);
  if (existing) {
    throw new Error("An account with this email already exists.");
  }

  const { passwordHash, salt } = createPasswordCredentials(input.password);
  const id = randomBytes(16).toString("hex");

  await getDb().insert(users).values({
    id,
    email,
    name,
    passwordHash,
    salt,
  });

  return { id, email, name };
}

export async function authenticateUserDb(
  email: string,
  password: string,
): Promise<PublicUser | null> {
  const user = await findUserByEmailDb(email);
  if (!user) return null;
  if (!verifyPassword(password, user.passwordHash, user.salt)) return null;
  return toPublicUser(user);
}
