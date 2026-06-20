"use client";

import { useEffect, useState } from "react";

type DemoFile = {
  name: string;
  ext: string;
  icon: string;
  before: string;
  after: string;
  savings: string;
  engine: string;
  color: string;
};

const DEMO_FILES: DemoFile[] = [
  {
    name: "whatsapp-video",
    ext: "MP4",
    icon: "🎬",
    before: "26.4 MB",
    after: "5.2 MB",
    savings: "80%",
    engine: "Video · adaptive encode",
    color: "from-violet-500/30 to-purple-600/20",
  },
  {
    name: "internship-report",
    ext: "PDF",
    icon: "📄",
    before: "1.19 MB",
    after: "0.75 MB",
    savings: "37%",
    engine: "PDF · smart optimize",
    color: "from-red-500/30 to-orange-600/20",
  },
  {
    name: "screenshot",
    ext: "JPG",
    icon: "🖼️",
    before: "4.8 MB",
    after: "1.9 MB",
    savings: "60%",
    engine: "Image · quality sweep",
    color: "from-cyan-500/30 to-blue-600/20",
  },
  {
    name: "dataset",
    ext: "CSV",
    icon: "📊",
    before: "890 KB",
    after: "148 KB",
    savings: "83%",
    engine: "Text · deep lossless",
    color: "from-emerald-500/30 to-teal-600/20",
  },
];

type Phase = "upload" | "analyze" | "compress" | "validate" | "download";

const PHASES: Phase[] = [
  "upload",
  "analyze",
  "compress",
  "validate",
  "download",
];

const PHASE_LABELS: Record<Phase, string> = {
  upload: "Uploading file…",
  analyze: "Analyzing type & routing…",
  compress: "Compressing with best engine…",
  validate: "Validating output…",
  download: "Ready to download!",
};

const PHASE_MS = 2200;

function phaseIndex(phase: Phase): number {
  return PHASES.indexOf(phase);
}

function isActive(current: Phase, target: Phase): boolean {
  return phaseIndex(current) >= phaseIndex(target);
}

export function CompressionHeroAnimation() {
  const [fileIdx, setFileIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>("upload");

  const file = DEMO_FILES[fileIdx];

  useEffect(() => {
    let step = 0;
    const tick = () => {
      step = (step + 1) % (PHASES.length + 1);
      if (step === PHASES.length) {
        setFileIdx((i) => (i + 1) % DEMO_FILES.length);
        setPhase("upload");
      } else {
        setPhase(PHASES[step]);
      }
    };
    const id = setInterval(tick, PHASE_MS);
    return () => clearInterval(id);
  }, []);

  const compressing = phase === "compress" || phase === "validate";
  const done = phase === "download";

  return (
    <div
      className="relative w-full max-w-lg mx-auto lg:mx-0 min-w-0"
      aria-hidden
    >
      <div className="absolute -inset-4 bg-gradient-to-br from-cyan-500/10 via-transparent to-emerald-500/10 rounded-3xl blur-2xl animate-pulse-slow" />

      <div className="relative rounded-2xl border border-white/15 bg-zinc-900/80 backdrop-blur-xl shadow-2xl overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-black/40">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
          <span className="ml-2 text-[10px] sm:text-xs text-gray-500 font-mono truncate">
            click-compress · pipeline
          </span>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
          {/* Status line */}
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-cyan-400 font-medium truncate">
              {PHASE_LABELS[phase]}
            </p>
            <span className="text-[10px] text-gray-600 font-mono shrink-0">
              {file.ext}
            </span>
          </div>

          {/* Pipeline steps */}
          <div className="flex items-center justify-between gap-0.5 sm:gap-1 overflow-x-auto scrollbar-none">
            {(
              [
                { id: "upload" as Phase, label: "Upload", icon: "↑" },
                { id: "analyze" as Phase, label: "Analyze", icon: "◎" },
                { id: "compress" as Phase, label: "Compress", icon: "⚡" },
                { id: "validate" as Phase, label: "Validate", icon: "✓" },
                { id: "download" as Phase, label: "Done", icon: "↓" },
              ] as const
            ).map((node, i) => {
              const active = phaseIndex(phase) >= phaseIndex(node.id);
              const current = phase === node.id;
              return (
                <div key={node.id} className="flex items-center flex-1 min-w-[3.25rem]">
                  <div className="flex flex-col items-center gap-1 flex-1">
                    <div
                      className={`flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full text-xs sm:text-sm border transition-all duration-500 ${
                        current
                          ? "border-cyan-400 bg-cyan-500/20 text-cyan-300 scale-110 shadow-[0_0_20px_rgba(34,211,238,0.35)]"
                          : active
                            ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-400"
                            : "border-white/10 bg-white/5 text-gray-600"
                      }`}
                    >
                      {node.icon}
                    </div>
                    <span
                      className={`text-[8px] sm:text-[9px] uppercase tracking-wider text-center leading-tight ${
                        active ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      {node.label}
                    </span>
                  </div>
                  {i < 4 && (
                    <div className="relative h-0.5 flex-1 mx-0.5 mb-4 overflow-hidden rounded bg-white/5">
                      <div
                        className={`absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-700 ${
                          phaseIndex(phase) > i ? "w-full" : "w-0"
                        }`}
                      />
                      {phaseIndex(phase) === i && (
                        <div className="absolute inset-0 pipeline-flow" />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* File visualization */}
          <div
            className={`relative rounded-xl border border-white/10 bg-gradient-to-br ${file.color} p-4 transition-all duration-700`}
          >
            <div className="flex items-start gap-4">
              <div
                className={`relative flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-black/50 text-3xl border border-white/10 transition-transform duration-700 ${
                  compressing ? "scale-75" : done ? "scale-90" : "scale-100"
                }`}
              >
                {file.icon}
                {compressing && (
                  <span className="absolute -inset-1 rounded-xl border-2 border-cyan-400/50 animate-ping-slow" />
                )}
              </div>

              <div className="flex-1 min-w-0 space-y-2">
                <p className="font-mono text-sm text-white truncate">
                  {file.name}.{file.ext.toLowerCase()}
                </p>

                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <p className="text-[10px] text-gray-500 uppercase">Before</p>
                    <p
                      className={`font-mono text-sm transition-opacity duration-500 ${
                        done ? "text-gray-600 line-through" : "text-gray-300"
                      }`}
                    >
                      {file.before}
                    </p>
                  </div>

                  <div className="flex-1 flex items-center justify-center">
                    <span
                      className={`text-lg transition-all duration-500 ${
                        compressing
                          ? "text-cyan-400 animate-pulse"
                          : "text-gray-600"
                      }`}
                    >
                      →
                    </span>
                  </div>

                  <div className="text-center">
                    <p className="text-[10px] text-gray-500 uppercase">After</p>
                    <p
                      className={`font-mono text-sm font-bold transition-all duration-700 ${
                        done || compressing
                          ? "text-emerald-400"
                          : "text-gray-600"
                      }`}
                    >
                      {done || compressing ? file.after : "—"}
                    </p>
                  </div>
                </div>

                {/* Shrink bar */}
                <div className="h-2 rounded-full bg-black/40 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-1000 ease-out"
                    style={{
                      width:
                        done || compressing
                          ? `${100 - parseInt(file.savings, 10)}%`
                          : "100%",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Engine badge */}
            <div
              className={`mt-3 flex items-center justify-between rounded-lg bg-black/30 px-3 py-2 transition-all duration-500 ${
                phaseIndex(phase) >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
              }`}
            >
              <span className="text-[10px] text-gray-500">Engine</span>
              <span className="text-xs font-mono text-purple-300">
                {file.engine}
              </span>
            </div>

            {/* Savings flash */}
            {done && (
              <div className="absolute top-3 right-3 rounded-full bg-emerald-500/20 border border-emerald-500/50 px-2.5 py-1 animate-pop-in">
                <span className="text-xs font-bold text-emerald-400">
                  −{file.savings}
                </span>
              </div>
            )}
          </div>

          {/* Binary rain during compress */}
          {compressing && (
            <div className="relative h-8 overflow-hidden rounded-lg bg-black/30 border border-white/5">
              <div className="absolute inset-0 binary-stream opacity-40" />
              <p className="relative z-10 text-center text-[10px] font-mono text-cyan-500/80 pt-2">
                re-encoding · downsampling · entropy coding
              </p>
            </div>
          )}

          {done && (
            <div className="flex items-center justify-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-950/30 py-2.5 animate-pop-in">
              <span className="text-emerald-400 text-sm">✓</span>
              <span className="text-xs text-emerald-300/90">
                Optimized file ready — lossless restore where selected
              </span>
            </div>
          )}
        </div>
      </div>

      <p className="mt-3 text-center text-[10px] text-gray-600">
        Live demo cycles video · PDF · image · CSV pipelines
      </p>
    </div>
  );
}
