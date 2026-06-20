"use server";

import {
  authenticateUser,
  clearSessionCookie,
  createUser,
  getSessionUser,
  setSessionCookie,
  type PublicUser,
} from "@/lib/auth-server";

export type AuthActionResult =
  | { ok: true; user: PublicUser }
  | { ok: false; error: string };

export async function getCurrentUserAction(): Promise<PublicUser | null> {
  return getSessionUser();
}

export async function signupAction(
  _prev: AuthActionResult | null,
  formData: FormData,
): Promise<AuthActionResult> {
  try {
    const name = String(formData.get("name") ?? "");
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const user = await createUser({ name, email, password });
    await setSessionCookie(user.id);
    return { ok: true, user };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Sign up failed.",
    };
  }
}

export async function loginAction(
  _prev: AuthActionResult | null,
  formData: FormData,
): Promise<AuthActionResult> {
  try {
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const user = await authenticateUser(email, password);
    if (!user) {
      return { ok: false, error: "Invalid email or password." };
    }
    await setSessionCookie(user.id);
    return { ok: true, user };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Login failed.",
    };
  }
}

export async function logoutAction(): Promise<void> {
  await clearSessionCookie();
}
