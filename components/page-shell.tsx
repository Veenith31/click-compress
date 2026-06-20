import type { ReactNode } from "react";

type PageShellProps = {
  children: ReactNode;
  narrow?: boolean;
  className?: string;
};

export function PageShell({
  children,
  narrow = false,
  className = "",
}: PageShellProps) {
  return (
    <div
      className={`mx-auto w-full px-3 sm:px-6 py-8 sm:py-10 lg:py-16 ${
        narrow ? "max-w-3xl" : "max-w-6xl"
      } ${className}`}
    >
      {children}
    </div>
  );
}
