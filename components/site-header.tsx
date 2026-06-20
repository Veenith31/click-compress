"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo } from "react";
import { useAuth } from "@/components/auth-provider";
import { SiteLogo } from "@/components/site-logo";
import { NAV_LINKS } from "@/lib/site-content";

const MY_FILES_LINK = { href: "/my-files", label: "My files" } as const;

function buildNavLinks(loggedIn: boolean) {
  const links = NAV_LINKS.filter((link) => link.href !== "/compress");
  if (!loggedIn) return links;

  const capIndex = links.findIndex((link) => link.href === "/capabilities");
  return [
    ...links.slice(0, capIndex + 1),
    MY_FILES_LINK,
    ...links.slice(capIndex + 1),
  ];
}

function NavLink({
  href,
  label,
  active,
  compact = false,
}: {
  href: string;
  label: string;
  active: boolean;
  compact?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`whitespace-nowrap rounded-lg transition-colors ${
        compact
          ? "shrink-0 rounded-full px-3.5 py-2 text-xs font-medium"
          : "px-3 py-2 text-[13px] xl:px-3.5 xl:py-2 xl:text-sm"
      } ${
        active
          ? compact
            ? "bg-white text-black"
            : "bg-white/10 text-white"
          : compact
            ? "bg-zinc-800/80 text-gray-300 hover:bg-zinc-700 hover:text-white"
            : "text-gray-400 hover:bg-white/5 hover:text-white"
      }`}
    >
      {label}
    </Link>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const navLinks = useMemo(() => buildNavLinks(Boolean(user)), [user]);

  async function handleLogout() {
    await logout();
    router.refresh();
    if (pathname.startsWith("/compress")) {
      router.push("/");
    }
  }

  function isActive(href: string) {
    return href === "/"
      ? pathname === "/"
      : pathname.startsWith(href);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/85 backdrop-blur-xl">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 xl:max-w-[88rem] xl:px-8">
        <div className="flex min-h-[4.25rem] items-center gap-4 xl:min-h-[4.5rem] xl:gap-8">
          <SiteLogo linked priority variant="header" />

          <nav
            className="hidden min-w-0 flex-1 items-center justify-center gap-0.5 lg:flex xl:gap-1"
            aria-label="Main"
          >
            {navLinks.map((link) => (
              <NavLink
                key={link.href}
                href={link.href}
                label={link.label}
                active={isActive(link.href)}
              />
            ))}
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-2.5 lg:ml-0 lg:gap-3 lg:border-l lg:border-white/10 lg:pl-5 xl:pl-6">
            {user ? (
              <>
                <span
                  className="hidden max-w-[11rem] truncate text-xs font-medium uppercase tracking-wide text-gray-400 xl:inline xl:max-w-[14rem] xl:text-[13px]"
                  title={user.name}
                >
                  {user.name}
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="whitespace-nowrap rounded-lg border border-gray-700 px-3 py-2 text-xs text-gray-300 transition-colors hover:border-gray-500 hover:text-white sm:text-sm"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="whitespace-nowrap rounded-lg px-3 py-2 text-xs text-gray-300 transition-colors hover:text-white sm:text-sm"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="whitespace-nowrap rounded-lg border border-gray-600 px-3 py-2 text-xs text-white transition-colors hover:bg-white/5 sm:text-sm"
                >
                  Sign up
                </Link>
              </>
            )}
            <Link
              href="/compress"
              className="whitespace-nowrap rounded-lg bg-white px-4 py-2 text-xs font-semibold text-black transition-colors hover:bg-gray-200 sm:px-5 sm:text-sm"
            >
              Compress
            </Link>
          </div>
        </div>
      </div>

      <nav
        className="flex gap-2 overflow-x-auto border-t border-white/5 px-4 py-2.5 scrollbar-none lg:hidden sm:px-6"
        aria-label="Main mobile"
      >
        {navLinks.map((link) => (
          <NavLink
            key={link.href}
            href={link.href}
            label={link.label}
            active={isActive(link.href)}
            compact
          />
        ))}
      </nav>
    </header>
  );
}
