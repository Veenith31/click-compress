"use client";

import Link from "next/link";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import {
  askClickAction,
  getAskClickAvailableAction,
  type AskClickMessage,
} from "@/app/actions/ask-click";
import { SiteLogo } from "@/components/site-logo";
import { ASK_CLICK_SUGGESTIONS } from "@/lib/ask-click-knowledge";
import { SITE } from "@/lib/site-content";

type SpeechRecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionResultEvent = {
  results: SpeechRecognitionResultList;
};

function getSpeechRecognitionCtor():
  | (new () => SpeechRecognitionInstance)
  | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function speakText(text: string, onEnd?: () => void) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const clean = text.replace(/\*\*/g, "").replace(/\*/g, "");
  const utter = new SpeechSynthesisUtterance(clean);
  utter.rate = 1;
  utter.pitch = 1;
  utter.onend = () => onEnd?.();
  window.speechSynthesis.speak(utter);
}

function stopSpeaking() {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

function renderMarkdownLite(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

const WELCOME: AskClickMessage = {
  role: "assistant",
  content: `Hey! I'm **Click**, your ${SITE.name} guide. Ask me how to compress files, what we support, or which mode to pick — type or use voice. I focus on helping you use the platform, not internal tech details.`,
};

function AskClickPortal({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(children, document.body);
}

type AskClickContextValue = {
  openAssistant: () => void;
  closeAssistant: () => void;
  isOpen: boolean;
};

const AskClickContext = createContext<AskClickContextValue>({
  openAssistant: () => {},
  closeAssistant: () => {},
  isOpen: false,
});

export function useAskClick() {
  return useContext(AskClickContext);
}

export function AskClickHeroButton() {
  const { openAssistant, isOpen } = useAskClick();
  if (isOpen) return null;
  return (
    <button
      type="button"
      onClick={openAssistant}
      className="rounded-xl border border-cyan-500/30 bg-cyan-950/30 px-6 py-3 text-base font-semibold text-cyan-300 hover:bg-cyan-950/50 hover:border-cyan-400/50 transition-all shadow-[0_0_30px_rgba(34,211,238,0.08)]"
    >
      Ask Click your questions
    </button>
  );
}

export function AskClickRoot({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <AskClickContext.Provider
      value={{
        openAssistant: () => setOpen(true),
        closeAssistant: () => setOpen(false),
        isOpen: open,
      }}
    >
      {children}
      <AskClickPanel open={open} onOpenChange={setOpen} />
    </AskClickContext.Provider>
  );
}

function AskClickPanel({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [messages, setMessages] = useState<AskClickMessage[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiAvailable, setAiAvailable] = useState<boolean | null>(null);
  const [voiceInput, setVoiceInput] = useState(false);
  const [voiceOutput, setVoiceOutput] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [panelMounted, setPanelMounted] = useState(false);
  const [panelClosing, setPanelClosing] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  useEffect(() => {
    if (open) {
      setPanelMounted(true);
      setPanelClosing(false);
    } else if (panelMounted) {
      setPanelClosing(true);
      const timer = window.setTimeout(() => {
        setPanelMounted(false);
        setPanelClosing(false);
      }, 250);
      return () => window.clearTimeout(timer);
    }
  }, [open, panelMounted]);

  useEffect(() => {
    setVoiceSupported(
      Boolean(getSpeechRecognitionCtor()) &&
        typeof window !== "undefined" &&
        "speechSynthesis" in window,
    );
    getAskClickAvailableAction().then(setAiAvailable);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  useEffect(() => {
    if (open && panelMounted && !panelClosing) {
      setTimeout(() => inputRef.current?.focus(), 220);
    }
    if (!open) {
      recognitionRef.current?.stop();
      setListening(false);
      stopSpeaking();
    }
  }, [open, panelMounted, panelClosing]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  const deliverReply = useCallback(
    (reply: string) => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: reply },
      ]);
      if (voiceOutput) {
        setSpeaking(true);
        speakText(reply, () => setSpeaking(false));
      }
    },
    [voiceOutput],
  );

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;

      const userMsg: AskClickMessage = { role: "user", content: trimmed };
      const nextHistory = [...messages, userMsg];
      setMessages(nextHistory);
      setInput("");
      setLoading(true);

      const result = await askClickAction(nextHistory);
      setLoading(false);
      deliverReply(result.reply);
    },
    [deliverReply, loading, messages],
  );

  function startListening() {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) return;

    stopSpeaking();
    stopListening();

    const recognition = new Ctor();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((r) => r[0]?.transcript ?? "")
        .join("");
      setInput(transcript);
    };

    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }

  function toggleListening() {
    if (listening) {
      stopListening();
      if (input.trim()) void sendMessage(input);
    } else {
      startListening();
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    void sendMessage(input);
  }

  return (
    <AskClickPortal>
      {!panelMounted && (
        <button
          type="button"
          onClick={() => onOpenChange(true)}
          className="fixed bottom-6 right-6 z-[70] group flex items-center gap-2.5 rounded-full border border-cyan-500/30 bg-black/90 px-4 py-3 shadow-[0_0_40px_rgba(34,211,238,0.15)] backdrop-blur-xl transition-all hover:border-cyan-400/50 hover:shadow-[0_0_50px_rgba(34,211,238,0.25)] sm:px-5"
          aria-label="Ask Click your questions"
        >
          <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-emerald-400 text-black font-bold text-sm">
            ?
            <span className="absolute inset-0 rounded-full bg-cyan-400/30 animate-ping opacity-75" />
          </span>
          <span className="hidden sm:flex flex-col items-start text-left">
            <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">
              Ask Click
            </span>
            <span className="text-[11px] text-gray-400">Your questions</span>
          </span>
        </button>
      )}

      {panelMounted && (
        <div
          role="dialog"
          aria-label="Ask Click assistant"
          className="ask-click-panel-slot"
        >
          <aside
            className={`ask-click-panel-card flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/98 shadow-[0_12px_48px_rgba(0,0,0,0.55)] backdrop-blur-xl ${
              panelClosing ? "animate-ask-click-out" : "animate-ask-click-in"
            }`}
          >
          <div className="relative border-b border-white/10 bg-gradient-to-r from-cyan-950/40 via-zinc-950 to-emerald-950/30 px-4 py-3.5 shrink-0">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(34,211,238,0.12),transparent_60%)]" />
            <div className="relative flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <SiteLogo iconHeight={26} iconWidth={36} showTitle={false} />
                <div className="min-w-0">
                  <p className="font-bold uppercase tracking-[0.12em] text-sm text-white">
                    Ask Click
                  </p>
                  <p className="text-[11px] text-gray-500 truncate">
                    {aiAvailable
                      ? "Always here to help"
                      : "Your compression guide"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="shrink-0 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-gray-200 hover:bg-white/10 hover:text-white transition-colors"
                aria-label="Close Ask Click"
              >
                Close
              </button>
            </div>

            {voiceSupported && (
              <div className="relative mt-2.5 flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setVoiceInput((v) => !v);
                  if (listening) stopListening();
                }}
                className={`rounded-full px-3 py-1 text-[11px] font-medium border transition-colors ${
                  voiceInput
                    ? "border-cyan-500/50 bg-cyan-500/15 text-cyan-300"
                    : "border-white/10 bg-white/5 text-gray-400 hover:text-white"
                }`}
              >
                Voice input {voiceInput ? "on" : "off"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setVoiceOutput((v) => {
                    if (v) stopSpeaking();
                    return !v;
                  });
                }}
                className={`rounded-full px-3 py-1 text-[11px] font-medium border transition-colors ${
                  voiceOutput
                    ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-300"
                    : "border-white/10 bg-white/5 text-gray-400 hover:text-white"
                }`}
              >
                Voice replies {voiceOutput ? "on" : "off"}
              </button>
              {(listening || speaking) && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 text-[11px] text-cyan-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  {listening ? "Listening…" : "Speaking…"}
                </span>
              )}
            </div>
          )}
        </div>

        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0"
        >
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-white text-black rounded-br-md"
                    : "bg-zinc-900 border border-white/10 text-gray-300 rounded-bl-md"
                }`}
              >
                {renderMarkdownLite(msg.content)}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-md border border-white/10 bg-zinc-900 px-4 py-3">
                <div className="flex gap-1">
                  {[0, 1, 2].map((d) => (
                    <span
                      key={d}
                      className="h-2 w-2 rounded-full bg-cyan-400/80 animate-bounce"
                      style={{ animationDelay: `${d * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {messages.length <= 1 && !loading && (
            <div className="flex flex-wrap gap-2 pt-1">
              {ASK_CLICK_SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => void sendMessage(s)}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-gray-300 hover:border-cyan-500/40 hover:bg-cyan-950/30 hover:text-cyan-200 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className="border-t border-white/10 bg-black/40 p-4 shrink-0"
        >
          <div className="flex gap-2 items-end">
            {voiceInput && voiceSupported && (
              <button
                type="button"
                onClick={toggleListening}
                disabled={loading}
                className={`shrink-0 flex h-11 w-11 items-center justify-center rounded-xl border transition-all ${
                  listening
                    ? "border-cyan-500/50 bg-cyan-500/20 text-cyan-300 animate-pulse"
                    : "border-white/15 bg-white/5 text-gray-300 hover:border-cyan-500/40 hover:text-cyan-300"
                }`}
                aria-label={listening ? "Stop listening" : "Start voice input"}
              >
                ●
              </button>
            )}
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              rows={1}
              placeholder={
                voiceInput
                  ? "Type or tap the mic…"
                  : "Ask anything — I'm happy to help!"
              }
              disabled={loading}
              className="flex-1 resize-none rounded-xl border border-white/10 bg-zinc-900/80 px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:border-cyan-500/40 focus:outline-none min-h-[44px] max-h-28"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="shrink-0 h-11 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 px-4 text-sm font-bold text-black disabled:opacity-40 hover:opacity-90 transition-opacity"
            >
              Send
            </button>
          </div>
          <p className="mt-2 text-[10px] text-gray-600 text-center">
            <Link href="/compress" className="text-cyan-600 hover:text-cyan-500">
              Open workbench →
            </Link>
          </p>
        </form>
          </aside>
        </div>
      )}
    </AskClickPortal>
  );
}
