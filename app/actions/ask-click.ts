"use server";

import {
  buildAskClickSystemPrompt,
  gratefulFallbackReply,
  offlineAskClickReply,
} from "@/lib/ask-click-knowledge";
import { isOpenRouterConfigured, openRouterChat } from "@/lib/openrouter";

export type AskClickMessage = {
  role: "user" | "assistant";
  content: string;
};

export type AskClickResponse = {
  ok: true;
  reply: string;
};

export async function askClickAction(
  history: AskClickMessage[],
): Promise<AskClickResponse> {
  const lastUser = [...history].reverse().find((m) => m.role === "user");
  const userText = lastUser?.content.trim() ?? "";

  if (!userText) {
    return {
      ok: true,
      reply: gratefulFallbackReply("hello"),
    };
  }

  if (isOpenRouterConfigured()) {
    try {
      const messages = [
        { role: "system" as const, content: buildAskClickSystemPrompt() },
        ...history.slice(-12).map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      ];

      const reply = await openRouterChat(messages, {
        temperature: 0.65,
        maxTokens: 450,
      });

      return { ok: true, reply };
    } catch {
      // fall through to offline grateful reply
    }
  }

  const offline = offlineAskClickReply(userText);
  if (offline) {
    return {
      ok: true,
      reply: `Great question — you're asking exactly the right things! ${offline}`,
    };
  }

  return { ok: true, reply: gratefulFallbackReply(userText) };
}

export async function getAskClickAvailableAction(): Promise<boolean> {
  return isOpenRouterConfigured();
}
