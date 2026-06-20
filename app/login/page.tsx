import { AuthForm } from "@/components/auth-form";
import { buildPageMetadata } from "@/lib/seo-metadata";

export const metadata = buildPageMetadata({
  title: "Log in",
  description: "Log in to Click-Compress to save compressed files securely.",
  path: "/login",
  noIndex: true,
});

export default function LoginPage() {
  return <AuthForm mode="login" />;
}

