"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import {
  loginAction,
  signupAction,
  type AuthActionResult,
} from "@/app/actions/auth";
import { useAuth } from "@/components/auth-provider";
import { PageShell } from "@/components/page-shell";
import { SiteLogo } from "@/components/site-logo";

type AuthFormProps = {
  mode: "login" | "signup";
};

const initial: AuthActionResult | null = null;

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const { setUser } = useAuth();
  const action = mode === "login" ? loginAction : signupAction;
  const [state, formAction, pending] = useActionState(action, initial);

  useEffect(() => {
    if (state?.ok) {
      setUser(state.user);
      router.push("/compress");
      router.refresh();
    }
  }, [state, setUser, router]);

  const title = mode === "login" ? "Log in" : "Create account";
  const subtitle =
    mode === "login"
      ? "Access your compression workbench"
      : "Sign up to save your session";

  return (
    <PageShell narrow className="flex flex-col items-center">
      <div className="w-full max-w-md border border-gray-800 rounded-3xl p-8 bg-zinc-900/50 backdrop-blur-xl shadow-2xl">
        <div className="flex justify-center mb-6">
          <SiteLogo variant="auth" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-gray-400 text-sm mt-1">{subtitle}</p>

        <form action={formAction} className="mt-6 space-y-4">
          {mode === "signup" && (
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                minLength={2}
                className="w-full rounded-xl border border-gray-700 bg-black/40 px-3 py-2 text-sm"
              />
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="w-full rounded-xl border border-gray-700 bg-black/40 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              required
              minLength={6}
              className="w-full rounded-xl border border-gray-700 bg-black/40 px-3 py-2 text-sm"
            />
          </div>

          {state && !state.ok && (
            <p className="text-sm text-red-400" role="alert">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            {pending
              ? mode === "login"
                ? "Logging in…"
                : "Creating account…"
              : title}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          {mode === "login" ? (
            <>
              No account?{" "}
              <Link href="/signup" className="text-white hover:underline">
                Sign up
              </Link>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <Link href="/login" className="text-white hover:underline">
                Log in
              </Link>
            </>
          )}
        </p>
      </div>
    </PageShell>
  );
}
