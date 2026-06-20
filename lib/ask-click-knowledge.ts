import { CAPABILITIES, MODES, SITE, STEPS } from "@/lib/site-content";

function platformFacts(): string {
  const caps = CAPABILITIES.map(
    (c) =>
      `- ${c.title} (${c.formats}): ${c.description} Typical savings: ${c.savings}.`,
  ).join("\n");

  const modes = MODES.map((m) => `- ${m.name}: ${m.summary}`).join("\n");

  const steps = STEPS.map((s) => `${s.step} ${s.title}: ${s.body}`).join("\n");

  return `
Platform: ${SITE.name}
Tagline: ${SITE.tagline}

How to compress:
1. Go to /compress (Compression workbench)
2. Choose a file
3. Pick a compression goal: Target 40% savings (recommended), High impact local (best for video & PDF), or Strict lossless (exact byte restore)
4. Pick mode: Fast, Balanced, or Maximum
5. Pick profile: Smart, Text focused, or Media focused
6. Optional: enable Smart AI routing for smarter profile selection
7. Click Compress, then download the result

Supported file categories:
${caps}

Compression goals:
${modes}

Pipeline steps:
${steps}

Privacy: Browser modes process locally. High impact local runs on your machine — files are not sent to external compression services.

Pages: Home (/), Capabilities (/capabilities), Compress (/compress), How it works (/how-it-works), About (/about), Login (/login), Sign up (/signup).

Auth: Optional login to save session; compression works without an account.

Smart routing: When enabled, AI helps pick the best compression profile for the file type before processing.
`.trim();
}

export function buildAskClickSystemPrompt(): string {
  return `You are Click, the warm and enthusiastic assistant for ${SITE.name} — a smart file compression platform.

PERSONALITY (always follow):
- Respond to EVERY message — thanks, greetings, goodbyes, small talk, typos, and questions.
- Be genuinely grateful and complimentary. Notice something positive about the user (their curiosity, kindness, smart questions, patience).
- Sound modern, friendly, and human — never robotic or cold.
- Start many replies with warmth: "Great question!", "You're so welcome!", "I love that you asked!", etc.
- Keep answers under 100 words unless giving step-by-step compression help.

STRICT RULES — NEVER break these:
- Do NOT mention programming languages, frameworks, libraries, APIs, model names, npm packages, source code, or internal architecture.
- Do NOT mention ffmpeg, Ghostscript, Brotli, OpenRouter, Next.js, WASM, or any third-party tool names.
- If asked what the platform is built with, how it works internally, or tech stack: thank them warmly for their curiosity, say ${SITE.name} is crafted for a smooth private experience, and redirect to how you can help them compress files — never refuse or show an error tone.
- Never say you cannot respond, failed, or ran into an error.
- Use markdown sparingly: **bold** for emphasis, short bullets when helpful.
- Suggest /compress when users want to try compression.

PLATFORM KNOWLEDGE:
${platformFacts()}`;
}

export function gratefulFallbackReply(userMessage: string): string {
  const q = userMessage.trim().toLowerCase();

  if (/thank|thx|tahnk|ty|appreciate|grateful|cheers/i.test(q)) {
    return `You're so welcome — and **thank you** for spending time with ${SITE.name}! Your kindness really makes our day. If you ever want to compress a file or explore formats, I'm right here for you.`;
  }

  if (/^(ok|okay|cool|nice|great|got it|understood|alright)\.?\s*(thanks?)?\.?$/i.test(q)) {
    return `Perfect — you've got this! I really appreciate how engaged you are. Whenever you're ready, head to **/compress** or ask me anything else.`;
  }

  if (/built|tech stack|technology|code|library|libraries|framework|how (are you|do you) (made|work|built)/i.test(q)) {
    return `What a thoughtful question — you clearly care about quality! ${SITE.name} is designed around **you**: fast, private, format-aware compression. I focus on helping you get great results rather than behind-the-scenes details. Want help picking the best mode for your files?`;
  }

  if (/hello|hi|hey|good (morning|afternoon|evening)/i.test(q)) {
    return `Hey there — so glad you're here! Welcome to **${SITE.name}**. You're going to love how simple compression can be. What would you like to know — formats, modes, or how to get started?`;
  }

  if (/bye|goodbye|see you|later/i.test(q)) {
    return `Goodbye for now — it was wonderful chatting with you! Come back anytime; you're always welcome here. Happy compressing!`;
  }

  const offline = offlineAskClickReply(userMessage);
  if (offline) {
    return `Great question — you're asking exactly the right things! ${offline}`;
  }

  return `Thank you for reaching out — I really appreciate you! ${SITE.name} helps you shrink video, PDF, images, documents, and text with smart local processing. Tell me what file you're working with, or open **/compress** to start — I'm happy to guide you.`;
}

const OFFLINE_PATTERNS: { match: RegExp; reply: string }[] = [
  {
    match: /how (do i|to) compress|start compress|use (the )?workbench/i,
    reply:
      "Open the **Compression workbench** at /compress, upload your file, choose **Target 40% savings** (recommended), pick **Fast / Balanced / Maximum** mode, then click **Compress**. Download when done!",
  },
  {
    match: /support|format|file type|what (type|kind)/i,
    reply:
      "We support **video** (MP4, MOV, MKV, AVI), **PDF**, **images** (PNG, JPG, WebP, and more), **office docs** (DOCX, PPTX, XLSX), **text/data** (CSV, JSON, TXT, MD), and **archives**. See /capabilities for details.",
  },
  {
    match: /video|mp4|mov/i,
    reply:
      "For video, use **High impact local** mode in the workbench for the best savings (typically 40–80%). Upload MP4, MOV, MKV, or AVI at /compress.",
  },
  {
    match: /pdf/i,
    reply:
      "PDFs work great with **Target 40%** or **High impact local**. Image-heavy PDFs often save 30–50%. Upload at /compress — text-only PDFs may save less.",
  },
  {
    match: /lossless|exact|original bytes/i,
    reply:
      "Choose **Strict lossless** in the workbench for byte-perfect restore. Best for text, data, and files where you cannot lose a single byte.",
  },
  {
    match: /privacy|local|upload|cloud|safe/i,
    reply:
      "Processing runs **locally** on your machine or in your browser session. We don't send your files to external compression services.",
  },
  {
    match: /account|login|sign up/i,
    reply:
      "An account is **optional**. Sign up at /signup to save your session, or compress immediately at /compress without logging in.",
  },
  {
    match: /what is|who are|about click/i,
    reply: `${SITE.name} is a format-aware compression platform that routes each file to the right optimization path — targeting around **40% savings** where possible.`,
  },
];

export function offlineAskClickReply(question: string): string | null {
  const q = question.trim();
  if (!q) return null;
  for (const { match, reply } of OFFLINE_PATTERNS) {
    if (match.test(q)) return reply;
  }
  return null;
}

export const ASK_CLICK_SUGGESTIONS = [
  "How do I compress a file?",
  "What formats do you support?",
  "Best mode for PDF?",
  "Is my data kept private?",
] as const;
