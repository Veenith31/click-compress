import { AuthForm } from "@/components/auth-form";
import { buildPageMetadata } from "@/lib/seo-metadata";

export const metadata = buildPageMetadata({
  title: "Sign up",
  description: "Create a free Click-Compress account to save compressed files.",
  path: "/signup",
  noIndex: true,
});

export default function SignupPage() {
  return <AuthForm mode="signup" />;
}

