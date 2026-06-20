"use server";

import { isOpenRouterConfigured } from "@/lib/openrouter";

export async function getCompressionAiStatusAction(): Promise<{
  configured: boolean;
}> {
  return {
    configured: isOpenRouterConfigured(),
  };
}
