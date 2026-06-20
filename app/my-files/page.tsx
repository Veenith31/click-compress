import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MyFilesPageClient } from "@/components/my-files-page-client";
import { getSessionUser } from "@/lib/auth-server";

export const metadata: Metadata = {
  title: "My files",
  description: "Your encrypted compressed files saved on Click-Compress.",
};

export default async function MyFilesPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login?next=/my-files");
  }
  return <MyFilesPageClient />;
}
