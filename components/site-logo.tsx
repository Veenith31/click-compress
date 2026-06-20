import Image from "next/image";
import Link from "next/link";
import { SITE } from "@/lib/site-content";

const ICON_HEIGHT = 256;
const ICON_WIDTH = 358;

export const BRAND_WORDMARK_CLASS =
  "font-bold uppercase tracking-[0.14em] text-white antialiased";

type SiteLogoProps = {
  iconHeight?: number;
  iconWidth?: number;
  showTitle?: boolean;
  linked?: boolean;
  className?: string;
  titleClassName?: string;
  priority?: boolean;
  variant?: "header" | "footer" | "auth";
};

const VARIANTS = {
  header: {
    iconHeight: 26,
    iconWidth: 38,
    title: "text-[15px] sm:text-[17px] leading-none",
    gap: "gap-2.5",
  },
  footer: {
    iconHeight: 22,
    iconWidth: 32,
    title: "text-sm leading-none",
    gap: "gap-2.5",
  },
  auth: {
    iconHeight: 30,
    iconWidth: 42,
    title: "text-lg sm:text-xl leading-none",
    gap: "gap-3",
  },
} as const;

export function SiteLogo({
  iconHeight,
  iconWidth,
  showTitle = true,
  linked = false,
  className = "",
  titleClassName = "",
  priority = false,
  variant = "header",
}: SiteLogoProps) {
  const preset = VARIANTS[variant];
  const height = iconHeight ?? preset.iconHeight;
  const displayWidth =
    iconWidth ?? Math.round(height * (ICON_WIDTH / ICON_HEIGHT));

  const content = (
    <span
      className={`inline-flex items-center ${preset.gap} ${className}`}
    >
      <Image
        src={SITE.logoIcon}
        alt=""
        aria-hidden
        width={ICON_WIDTH}
        height={ICON_HEIGHT}
        priority={priority}
        className="shrink-0 object-contain"
        style={{ height, width: displayWidth }}
      />
      {showTitle && (
        <span
          className={`${BRAND_WORDMARK_CLASS} whitespace-nowrap ${preset.title} ${titleClassName}`}
        >
          {SITE.brandWordmark}
        </span>
      )}
    </span>
  );

  if (linked) {
    return (
      <Link
        href="/"
        className="inline-flex shrink-0 items-center transition-opacity hover:opacity-90"
      >
        {content}
      </Link>
    );
  }

  return content;
}
