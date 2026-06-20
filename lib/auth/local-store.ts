import { randomBytes } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {
  createPasswordCredentials,
  toPublicUser,
  verifyPassword,
  type PublicUser,
} from "@/lib/auth/crypto";

const USERS_PATH = path.join(process.cwd(), ".data", "users.json");

export type StoredUser = PublicUser & {
  passwordHash: string;
  salt: string;
  createdAt: string;
};

type UserStore = {
  users: StoredUser[];
};

function readStore(): UserStore {
  if (!fs.existsSync(USERS_PATH)) {
    return { users: [] };
  }
  return JSON.parse(fs.readFileSync(USERS_PATH, "utf8")) as UserStore;
}

function writeStore(store: UserStore): void {
  fs.mkdirSync(path.dirname(USERS_PATH), { recursive: true });
  fs.writeFileSync(USERS_PATH, JSON.stringify(store, null, 2), "utf8");
}

export function findUserByEmailLocal(email: string): StoredUser | undefined {
  const normalized = email.trim().toLowerCase();
  return readStore().users.find((u) => u.email === normalized);
}

export function findUserByIdLocal(userId: string): PublicUser | null {
  const user = readStore().users.find((u) => u.id === userId);
  return user ? toPublicUser(user) : null;
}

export function createUserLocal(input: {
  email: string;
  name: string;
  password: string;
}): PublicUser {
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

  const store = readStore();
  if (store.users.some((u) => u.email === email)) {
    throw new Error("An account with this email already exists.");
  }

  const { passwordHash, salt } = createPasswordCredentials(input.password);
  const user: StoredUser = {
    id: randomBytes(16).toString("hex"),
    email,
    name,
    passwordHash,
    salt,
    createdAt: new Date().toISOString(),
  };

  store.users.push(user);
  writeStore(store);
  return toPublicUser(user);
}

export function authenticateUserLocal(
  email: string,
  password: string,
): PublicUser | null {
  const user = findUserByEmailLocal(email);
  if (!user) return null;
  if (!verifyPassword(password, user.passwordHash, user.salt)) return null;
  return toPublicUser(user);
}
