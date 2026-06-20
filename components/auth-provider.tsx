"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  getCurrentUserAction,
  logoutAction,
} from "@/app/actions/auth";
import type { PublicUser } from "@/lib/auth-server";

type AuthContextValue = {
  user: PublicUser | null;
  setUser: (user: PublicUser | null) => void;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  initialUser,
  children,
}: {
  initialUser: PublicUser | null;
  children: ReactNode;
}) {
  const [user, setUser] = useState<PublicUser | null>(initialUser);

  const refreshUser = useCallback(async () => {
    const next = await getCurrentUserAction();
    setUser(next);
  }, []);

  const logout = useCallback(async () => {
    await logoutAction();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, setUser, refreshUser, logout }),
    [user, refreshUser, logout],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
