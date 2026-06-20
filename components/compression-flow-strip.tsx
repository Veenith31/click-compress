"use client";

import { useEffect, useRef, useState } from "react";
import { STEPS } from "@/lib/site-content";

export function CompressionFlowStrip() {
  const [active, setActive] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = setInterval(() => {
      setActive((a) => (a + 1) % STEPS.length);
    }, 3500);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const container = ref.current;
    const el = container?.querySelector(
      `[data-step="${active}"]`,
    ) as HTMLElement | null;
    if (!container || !el) return;

    const left =
      el.offsetLeft - (container.clientWidth - el.clientWidth) / 2;
    container.scrollTo({
      left: Math.max(0, left),
      behavior: "smooth",
    });
  }, [active]);

  return (
    <div className="relative">
      <div
        ref={ref}
        className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-none"
      >
        {STEPS.map((step, i) => (
          <article
            key={step.step}
            data-step={i}
            className={`snap-center shrink-0 w-[min(100%,280px)] rounded-2xl border p-5 transition-all duration-500 ${
              i === active
                ? "border-cyan-500/50 bg-cyan-950/20 shadow-[0_0_30px_rgba(34,211,238,0.12)]"
                : "border-white/10 bg-zinc-900/30 opacity-70"
            }`}
          >
            <span
              className={`inline-block text-xs font-mono font-bold px-2 py-0.5 rounded ${
                i === active ? "bg-cyan-500/20 text-cyan-400" : "bg-white/5 text-gray-500"
              }`}
            >
              {step.step}
            </span>
            <h3 className="mt-3 font-semibold text-white">{step.title}</h3>
            <p className="mt-2 text-sm text-gray-400 leading-relaxed">{step.body}</p>
            {i === active && (
              <div className="mt-4 h-1 rounded-full bg-white/5 overflow-hidden">
                <div className="h-full bg-cyan-400 rounded-full animate-step-progress" />
              </div>
            )}
          </article>
        ))}
      </div>

      <div className="flex justify-center gap-1.5 mt-2">
        {STEPS.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Step ${i + 1}`}
            onClick={() => setActive(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === active ? "w-6 bg-cyan-400" : "w-1.5 bg-white/20"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
