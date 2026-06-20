#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  PageBreak,
  Table,
  TableRow,
  TableCell,
  WidthType,
  ImageRun,
} from "docx";
import PptxGenJS from "pptxgenjs";
import { generateSnapshots } from "./generate-snapshots.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "public", "downloads");
fs.mkdirSync(outDir, { recursive: true });

const INTERNSHIP_SLIDES = [
  {
    title: "Internship Presentation",
    subtitle: "Master of Computer Applications · VTU · 2025–2026",
    studentBlock: {
      name: "Veenith Kumar S",
      usn: "1BI24MC159",
      college: "Bangalore Institute of Technology",
      department: "Department of MCA",
      program: "Master of Computer Applications",
      semester: "4th Semester MCA",
    },
    richBody: [
      { text: "Presented by ", highlight: false },
      { text: "Veenith Kumar S", highlight: true, color: "0891B2", bold: true },
      { text: " — USN ", highlight: false },
      { text: "1BI24MC159", highlight: true, color: "10B981", bold: true },
    ],
    keyPoints: [
      "Autonomous institution under Visvesvaraya Technological University (VTU)",
      "Internship sub code: MINT483 · Academic year 2025–2026",
      "Hands-on industry internship with structured weekly progress and assessments",
    ],
    footer: "Bangalore Institute of Technology · Bengaluru",
  },
  {
    title: "Internship Overview",
    subtitle: "Junior Software Development Intern",
    highlights: [
      {
        label: "Organization",
        text: "Edutainer (PAT Technologies Private Limited) — edutainment & skill-based learning, Bengaluru",
      },
      {
        label: "Internship role",
        text: "Junior Software Developer Intern — assist in design, coding, testing, and maintaining software under mentor guidance",
      },
      {
        label: "Internal guide",
        text: "Prof. Seema Nagaraj, Assistant Professor, Department of MCA, BIT",
      },
      {
        label: "External guide",
        text: "Bunty Deb, Program Manager, Edutainer",
      },
    ],
    keyPoints: [
      "12-week program: web development, React JS, Python, networking & cybersecurity",
      "Weekly assignments, quizzes, activities, and mini projects",
      "Goal: bridge academic knowledge with industry-ready software skills",
    ],
    footer: "Partial fulfillment · MCA degree · VTU",
  },
  {
    title: "Work Done During Internship",
    intro: "Technical modules and practical tasks completed at Edutainer:",
    bullets: [
      [
        { text: "Web & React", highlight: true },
        { text: " — HTML, CSS, Bootstrap, React Hooks, Router, API fetch/CRUD, forms & validation" },
      ],
      [
        { text: "Python", highlight: true },
        { text: " — OOP, data structures, multithreading; Student Management & Banking mini projects" },
      ],
      [
        { text: "Networking & security", highlight: true },
        { text: " — topologies, wireless security, VPN, firewalls, IPS, malware & DLP concepts" },
      ],
      [
        { text: "Tools used", highlight: true },
        { text: " — VS Code, Node.js, Python, Git; documentation & weekly progress tracking" },
      ],
    ],
    modes: [
      {
        name: "Month 1",
        desc: "Web development fundamentals + React JS (components, hooks, APIs, routing)",
      },
      {
        name: "Month 2",
        desc: "Python programming (loops, functions, OOP, multithreading, mini projects)",
      },
      {
        name: "Month 3",
        desc: "Networking fundamentals + enterprise cybersecurity practices",
      },
    ],
    footer: "Source: Internship report · Edutainer program curriculum",
  },
  {
    title: "Major Project — Click-Compress",
    type: "snapshot",
    imageKey: "edutainerDashboard",
    imageSecondary: "edutainerInternships",
    caption:
      "Edutainer internship portal (left) · Click-Compress built as the Smart Data Compression Platform",
    richBody: [
      { text: "Capstone work during internship: ", highlight: false },
      { text: "Click-Compress", highlight: true, color: "0891B2", bold: true },
      { text: " — a format-aware file compression web app (Next.js, TypeScript, ffmpeg, Ghostscript, Brotli).", highlight: false },
    ],
    keyPoints: [
      "Demonstrated PDF (86% saved), video HEVC (67.6%), CSV Brotli (83.3%) in testing",
      "35 test cases documented for upload, compression, UI, and security",
      "Following slides detail the compression platform architecture & results",
    ],
    callouts: [
      { label: "Student", color: "0891B2", text: "Veenith Kumar S · 1BI24MC159" },
      { label: "College", color: "333333", text: "Bangalore Institute of Technology" },
    ],
    footer: "Internship + project presentation · Click-Compress",
  },
];

const PLATFORM_SLIDES = [
  {
    title: "Click-Compress",
    subtitle: "Smart compression platform for every file type",
    richBody: [
      { text: "A ", highlight: false },
      { text: "format-aware", highlight: true, color: "0891B2" },
      { text: " web platform that shrinks ", highlight: false },
      { text: "video, PDF, images, and documents", highlight: true, color: "1a1a1a", bold: true },
      { text: " using the right algorithm per file — not a generic zip tool.", highlight: false },
    ],
    richBody2: [
      { text: "Built as a ", highlight: false },
      { text: "full-stack Next.js application", highlight: true, color: "0891B2" },
      { text: " with a public marketing site, compression workbench, and downloadable project materials.", highlight: false },
    ],
    highlights: [
      {
        label: "Who it's for",
        text: "Students, creators, remote workers, and teams who need smaller files fast.",
      },
      {
        label: "Core promise",
        text: "Pick the best codec per format — HEVC for video, Ghostscript for PDF, Brotli for text.",
      },
      {
        label: "Privacy angle",
        text: "Browser and local-server processing — no third-party compression API required.",
      },
    ],
    keyPoints: [
      "Target ~40% savings with honest reporting when files are already dense",
      "Three modes: Target 40%, High impact local, Strict lossless",
      "Real-world proof: 26 MB WhatsApp video → 5.15 MB (80.5% saved, QuickTime-safe)",
      "Pages: Home · Capabilities · Compress · How it works · About · Downloads",
    ],
    footer: "Click-Compress · Intelligent Compression Platform · Project deck",
  },
  {
    title: "The problem",
    richBody: [
      { text: "Every day, people struggle with ", highlight: false },
      { text: "files that are too big", highlight: true, color: "0891B2" },
      { text: " for email attachments, LMS uploads, messaging apps, and cloud storage limits.", highlight: false },
    ],
    richBody2: [
      { text: "Most online compressors use ", highlight: false },
      { text: "one algorithm for everything", highlight: true, color: "0891B2" },
      { text: " — ZIP or basic Gzip — which barely touches video, PDF, or pre-compressed archives.", highlight: false },
    ],
    bullets: [
      [
        { text: "Share & upload limits", highlight: true },
        { text: " block WhatsApp videos, email attachments, and form uploads." },
      ],
      [
        { text: "Generic tools", highlight: true },
        { text: " save 0–5% on MP4, JPG, and PDF that are already optimized." },
      ],
      [
        { text: "Cloud-only services", highlight: true },
        { text: " require uploading sensitive docs, photos, and coursework." },
      ],
      [
        { text: "Broken output", highlight: true },
        { text: " — aggressive encoding can ruin QuickTime playback or document layout." },
      ],
      [
        { text: "No clear target", highlight: true },
        { text: " — users want ~40% reduction but tools only say \"done\" without metrics." },
      ],
      [
        { text: "Wrong trade-off", highlight: true },
        { text: " — lossy vs lossless is confusing; people need guided modes." },
      ],
    ],
    stats: [
      { value: "26+ MB", label: "Typical phone video before compress" },
      { value: "<6 MB", label: "After Click-Compress (demo run)" },
      { value: "40%", label: "Minimum savings target we aim for" },
    ],
    closing:
      "The gap: users need format-specific, trustworthy compression — not another generic zipper.",
    footer: "Why Click-Compress exists",
  },
  {
    title: "Our solution",
    intro: "Click-Compress routes each upload through a specialized pipeline:",
    modes: [
      { name: "Target 40%", desc: "Re-encode when needed to hit size goals (recommended)." },
      { name: "High impact local", desc: "ffmpeg + Ghostscript on your machine for video & PDF." },
      { name: "Strict lossless", desc: "Brotli, Gzip, RLE, LZW — exact byte restore." },
    ],
    footer: "Browser-first for images & text · Native engines for heavy media",
  },
  {
    title: "What we compress",
    table: {
      headers: ["Type", "Method", "Typical savings"],
      rows: [
        ["Video (MP4, MOV…)", "H.264 / H.265 (hvc1) + AAC", "40–80%"],
        ["PDF", "Ghostscript /ebook + /screen", "30–50%"],
        ["Images", "WebP / JPEG quality sweep", "35–60%"],
        ["Office & text", "Brotli Q11 / Gzip", "20–90%"],
      ],
    },
    note: "Dispatcher picks the smallest valid output (e.g. H.264 vs H.265 for QuickTime).",
  },
  {
    title: "How it works",
    intro:
      "End-to-end pipeline — from file selection to a verified, downloadable result:",
    numbered: [
      {
        step: "Upload",
        detail: "User opens the Compression workbench and selects a file.",
        sub: "Choose goal (Target 40%, High impact local, Strict lossless), mode (Fast / Balanced / Max), and profile (Smart, Text, Media).",
      },
      {
        step: "Analyze",
        detail: "The dispatcher reads MIME type, extension, and file structure.",
        sub: "Detects video, PDF, image, Office ZIP, .br/.gz wrappers, and plain text — then picks candidate engines.",
      },
      {
        step: "Compress",
        detail: "The best engine runs for that file type.",
        sub: "Browser: Brotli-wasm, canvas WebP/JPEG, fflate. Native: ffmpeg (H.264 + H.265 hvc1), Ghostscript /ebook + /screen.",
      },
      {
        step: "Validate",
        detail: "Outputs are checked before the user downloads.",
        sub: "ffprobe on video, round-trip on lossless, QuickTime-safe tags — smallest valid file wins.",
      },
      {
        step: "Download",
        detail: "User gets the optimized file plus a results panel.",
        sub: "Shows method name, original vs compressed size, savings %, and whether the 40% target was hit.",
      },
    ],
    pipeline: [
      "Browser path → images, text, JSON, CSV, strict-lossless archives",
      "Native path → MP4/MOV video, PDF, JPEG/PNG via ffmpeg & Ghostscript",
      "Fallback → ffmpeg.wasm in-browser if native ffmpeg is unavailable",
    ],
    closing:
      "Large uploads supported (up to 100 MB) for server-action video compression.",
    footer: "Simple UX on the surface · specialized engines underneath",
  },
  {
    title: "Result snapshot — Video",
    type: "snapshot",
    imageKey: "videoResult",
    caption: "Real test: WhatsApp video (26.34 MB → 5.15 MB)",
    callouts: [
      { label: "80.5% saved", color: "10B981" },
      { label: "QuickTime-safe H.265 (hvc1)", color: "8B5CF6" },
      { label: "Target ≥40% hit", color: "10B981" },
    ],
  },
  {
    title: "Platform snapshot — Workbench",
    type: "snapshot",
    imageKey: "workbench",
    caption: "Upload UI with goal selection and one-click compress",
    callouts: [
      { label: "High impact local mode", color: "A78BFA" },
      { label: "Media / text / smart profiles", color: "22D3EE" },
    ],
  },
  {
    title: "Platform snapshot — Home",
    type: "snapshot",
    imageKey: "home",
    caption: "Marketing home with stats and capability overview",
    callouts: [
      { label: "40%+ target savings", color: "10B981" },
      { label: "6+ file categories", color: "FFFFFF" },
    ],
  },
  {
    title: "Technology & summary",
    stack: ["Next.js", "TypeScript", "brotli-wasm", "fflate", "ffmpeg", "Ghostscript"],
    bullets: [
      "Multi-page site: Home, Capabilities, Compress, How it works, About, Downloads",
      "100 MB server-action limit for large video uploads",
      "Honest metrics when files are already optimal",
    ],
    goal: "Make large files smaller, playable, and shareable — simply.",
  },
];

const SLIDES = [...INTERNSHIP_SLIDES, ...PLATFORM_SLIDES];

function richToDocxRuns(parts) {
  return parts.map(
    (p) =>
      new TextRun({
        text: p.text,
        bold: p.bold || p.highlight,
        color: p.color?.replace("#", "") || (p.highlight ? "0891B2" : undefined),
      }),
  );
}

function bulletParagraphsRich(items) {
  return items.map((parts) => {
    const flat = Array.isArray(parts) ? parts : [{ text: parts }];
    return new Paragraph({
      children: richToDocxRuns(flat),
      bullet: { level: 0 },
      spacing: { after: 120 },
    });
  });
}

function appendDocxHeadExtras(blocks, s) {
  if (s.richBody2) {
    blocks.push(
      new Paragraph({
        children: richToDocxRuns(s.richBody2),
        spacing: { after: 160 },
      }),
    );
  }

  if (s.highlights) {
    for (const h of s.highlights) {
      blocks.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${h.label}: `, bold: true, color: "0891B2" }),
            new TextRun(h.text),
          ],
          spacing: { after: 120 },
        }),
      );
    }
  }

  if (s.keyPoints) {
    for (const k of s.keyPoints) {
      blocks.push(
        new Paragraph({
          text: k,
          bullet: { level: 0 },
          spacing: { after: 100 },
        }),
      );
    }
  }
}

function appendDocxTailExtras(blocks, s) {
  if (s.stats) {
    blocks.push(
      new Paragraph({
        children: [
          new TextRun({ text: "By the numbers: ", bold: true }),
          new TextRun(
            s.stats.map((st) => `${st.value} (${st.label})`).join(" · "),
          ),
        ],
        spacing: { before: 160, after: 120 },
      }),
    );
  }

  if (s.pipeline) {
    for (const line of s.pipeline) {
      blocks.push(
        new Paragraph({
          text: line,
          bullet: { level: 0 },
          spacing: { after: 100 },
        }),
      );
    }
  }

  if (s.closing) {
    blocks.push(
      new Paragraph({
        children: [
          new TextRun({ text: s.closing, italics: true, bold: true, color: "333333" }),
        ],
        spacing: { before: 160, after: 120 },
      }),
    );
  }
}

function renderPptxHeadExtras(slide, s, startY) {
  let y = startY;

  if (s.richBody2) {
    addRichText(slide, s.richBody2, {
      x: 0.5,
      y,
      w: 9,
      h: 0.7,
      fontSize: 13,
      valign: "top",
    });
    y += 0.75;
  }

  if (s.highlights) {
    const runs = [];
    for (const h of s.highlights) {
      runs.push({
        text: `${h.label}: `,
        options: { fontSize: 12, bold: true, color: "0891B2", fontFace: "Arial" },
      });
      runs.push({
        text: `${h.text}\n`,
        options: { fontSize: 12, color: "444444", fontFace: "Arial" },
      });
    }
    slide.addText(runs, { x: 0.5, y, w: 9, h: 0.95, valign: "top" });
    y += 1.0;
  }

  if (s.keyPoints) {
    slide.addText(
      s.keyPoints.map((k) => `• ${k}`).join("\n"),
      {
        x: 0.5,
        y,
        w: 9,
        h: 1.15,
        fontSize: 11,
        color: "333333",
        fontFace: "Arial",
        valign: "top",
      },
    );
    y += 1.2;
  }

  return y;
}

function renderPptxTailExtras(slide, s, startY) {
  let y = startY;

  if (s.stats) {
    const statRuns = [];
    for (const st of s.stats) {
      statRuns.push({
        text: `${st.value}  `,
        options: { fontSize: 18, bold: true, color: "10B981", fontFace: "Arial" },
      });
      statRuns.push({
        text: `${st.label}    `,
        options: { fontSize: 10, color: "666666", fontFace: "Arial" },
      });
    }
    slide.addText(statRuns, { x: 0.5, y, w: 9, h: 0.55, valign: "top" });
    y += 0.6;
  }

  if (s.pipeline) {
    slide.addText(
      s.pipeline.map((p) => `→ ${p}`).join("\n"),
      {
        x: 0.5,
        y,
        w: 9,
        h: 0.7,
        fontSize: 11,
        color: "555555",
        fontFace: "Arial",
        valign: "top",
      },
    );
    y += 0.75;
  }

  if (s.closing) {
    slide.addText(s.closing, {
      x: 0.5,
      y,
      w: 9,
      h: 0.4,
      fontSize: 12,
      italic: true,
      bold: true,
      color: "333333",
      fontFace: "Arial",
    });
    y += 0.45;
  }

  return y;
}

async function buildDocx(snapshotPaths) {
  const sections = [];

  for (let i = 0; i < SLIDES.length; i++) {
    const s = SLIDES[i];
    const blocks = [
      new Paragraph({
        text: s.title,
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 200 },
      }),
    ];

    if (s.subtitle) {
      blocks.push(
        new Paragraph({
          children: [new TextRun({ text: s.subtitle, italics: true })],
          spacing: { after: 200 },
        }),
      );
    }

    if (s.studentBlock) {
      const sb = s.studentBlock;
      blocks.push(
        new Paragraph({
          children: [
            new TextRun({ text: sb.name, bold: true, size: 28, color: "0891B2" }),
          ],
          spacing: { after: 120 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "USN: ", bold: true }),
            new TextRun({ text: sb.usn, bold: true, color: "10B981" }),
          ],
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: sb.college, bold: true }),
          ],
          spacing: { after: 80 },
        }),
        new Paragraph({
          text: `${sb.department} · ${sb.program} · ${sb.semester}`,
          spacing: { after: 160 },
        }),
      );
    }

    if (s.richBody) {
      blocks.push(
        new Paragraph({ children: richToDocxRuns(s.richBody), spacing: { after: 160 } }),
      );
    }

    appendDocxHeadExtras(blocks, s);

    if (s.intro) {
      blocks.push(new Paragraph({ text: s.intro, spacing: { after: 120 } }));
    }

    if (s.modes) {
      for (const m of s.modes) {
        blocks.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${m.name}: `, bold: true, color: "0891B2" }),
              new TextRun(m.desc),
            ],
            bullet: { level: 0 },
            spacing: { after: 100 },
          }),
        );
      }
    }

    if (s.bullets && typeof s.bullets[0] === "string") {
      blocks.push(...bulletParagraphsRich(s.bullets.map((b) => [{ text: b }])));
    } else if (s.bullets && Array.isArray(s.bullets[0])) {
      blocks.push(...bulletParagraphsRich(s.bullets));
    }

    if (s.numbered) {
      for (const n of s.numbered) {
        blocks.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${n.step}: `, bold: true }),
              new TextRun(n.detail),
            ],
            spacing: { after: 80 },
          }),
        );
        if (n.sub) {
          blocks.push(
            new Paragraph({
              children: [new TextRun({ text: n.sub, italics: true, color: "666666" })],
              indent: { left: 360 },
              spacing: { after: 120 },
            }),
          );
        }
      }
    }

    appendDocxTailExtras(blocks, s);

    if (s.table) {
      blocks.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: s.table.headers.map(
                (h) =>
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [new TextRun({ text: h, bold: true })],
                      }),
                    ],
                  }),
              ),
            }),
            ...s.table.rows.map(
              (row) =>
                new TableRow({
                  children: row.map(
                    (cell) =>
                      new TableCell({
                        children: [new Paragraph({ text: cell })],
                      }),
                  ),
                }),
            ),
          ],
        }),
      );
    }

    if (s.note) {
      blocks.push(
        new Paragraph({
          children: [new TextRun({ text: s.note, italics: true, color: "666666" })],
          spacing: { before: 160 },
        }),
      );
    }

    if (s.type === "snapshot" && snapshotPaths[s.imageKey]) {
      const imgData = fs.readFileSync(snapshotPaths[s.imageKey]);
      blocks.push(
        new Paragraph({
          children: [
            new ImageRun({
              data: imgData,
              transformation: { width: 480, height: 270 },
            }),
          ],
          spacing: { before: 200, after: 120 },
        }),
      );
      if (s.imageSecondary && snapshotPaths[s.imageSecondary]) {
        const img2 = fs.readFileSync(snapshotPaths[s.imageSecondary]);
        blocks.push(
          new Paragraph({
            children: [
              new ImageRun({
                data: img2,
                transformation: { width: 480, height: 270 },
              }),
            ],
            spacing: { after: 120 },
          }),
        );
      }
      blocks.push(new Paragraph({ text: s.caption, spacing: { after: 120 } }));
      if (s.callouts) {
        for (const c of s.callouts) {
          const line = c.text ? `${c.label}: ${c.text}` : c.label;
          blocks.push(
            new Paragraph({
              children: [
                new TextRun({ text: `• ${line}`, bold: true, color: c.color }),
              ],
            }),
          );
        }
      }
    }

    if (s.stack) {
      blocks.push(
        new Paragraph({
          children: [
            new TextRun({ text: "Stack: ", bold: true }),
            new TextRun(s.stack.join(", ")),
          ],
          spacing: { after: 160 },
        }),
      );
    }

    if (s.goal) {
      blocks.push(
        new Paragraph({
          children: [
            new TextRun({ text: "Goal: ", bold: true }),
            new TextRun({ text: s.goal, bold: true, color: "0891B2" }),
          ],
          spacing: { before: 200 },
        }),
      );
    }

    if (s.footer) {
      blocks.push(
        new Paragraph({
          children: [new TextRun({ text: s.footer, italics: true, color: "666666" })],
          spacing: { before: 200 },
        }),
      );
    }

    if (i < SLIDES.length - 1) {
      blocks.push(new Paragraph({ children: [new PageBreak()] }));
    }

    sections.push(...blocks);
  }

  const doc = new Document({
    sections: [{ properties: {}, children: sections }],
  });

  const buffer = await Packer.toBuffer(doc);
  const filePath = path.join(outDir, "Click-Compress-Project-Slides.docx");
  fs.writeFileSync(filePath, buffer);
  return filePath;
}

function addRichText(slide, parts, opts) {
  const runs = parts.map((p) => ({
    text: p.text,
    options: {
      fontSize: opts.fontSize || 16,
      fontFace: "Arial",
      color: p.color || "333333",
      bold: p.bold || p.highlight || false,
    },
  }));
  slide.addText(runs, opts);
}

function buildPptx(snapshotPaths) {
  const pptx = new PptxGenJS();
  pptx.author = "Click-Compress";
  pptx.title = "Click-Compress Project Slides";
  pptx.layout = "LAYOUT_16x9";

  const titleOpts = {
    x: 0.5,
    y: 0.35,
    w: 9,
    h: 0.75,
    fontSize: 30,
    bold: true,
    color: "1a1a1a",
    fontFace: "Arial",
  };

  for (const s of SLIDES) {
    const slide = pptx.addSlide();
    slide.background = { color: "F5F5F0" };
    slide.addText(s.title, titleOpts);

    let y = 1.0;

    if (s.studentBlock) {
      const sb = s.studentBlock;
      slide.addText(
        [
          { text: sb.name, options: { fontSize: 24, bold: true, color: "0891B2", fontFace: "Arial" } },
          { text: `\nUSN: ${sb.usn}`, options: { fontSize: 18, bold: true, color: "10B981", fontFace: "Arial" } },
          { text: `\n${sb.college}`, options: { fontSize: 16, bold: true, color: "1a1a1a", fontFace: "Arial" } },
          { text: `\n${sb.department}`, options: { fontSize: 13, color: "444444", fontFace: "Arial" } },
          { text: `\n${sb.program} · ${sb.semester}`, options: { fontSize: 13, color: "444444", fontFace: "Arial" } },
        ],
        { x: 0.5, y: 0.95, w: 9, h: 1.35, valign: "top" },
      );
      y = 2.4;
    }

    if (s.type === "snapshot" && snapshotPaths[s.imageKey]) {
      const imgW = s.imageSecondary ? 2.35 : 5.2;
      slide.addImage({
        path: snapshotPaths[s.imageKey],
        x: 0.5,
        y: 1.05,
        w: imgW,
        h: 2.5,
        sizing: { type: "contain", w: imgW, h: 2.5 },
      });

      if (s.imageSecondary && snapshotPaths[s.imageSecondary]) {
        slide.addImage({
          path: snapshotPaths[s.imageSecondary],
          x: 3.05,
          y: 1.05,
          w: 2.35,
          h: 2.5,
          sizing: { type: "contain", w: 2.35, h: 2.5 },
        });
      }

      const textX = s.imageSecondary ? 5.55 : 0.5;
      const textW = s.imageSecondary ? 3.95 : 9;

      if (s.richBody) {
        addRichText(slide, s.richBody, {
          x: textX,
          y: 1.1,
          w: textW,
          h: 0.55,
          fontSize: 12,
          valign: "top",
        });
      }

      slide.addText(s.caption, {
        x: textX,
        y: 1.65,
        w: textW,
        h: 0.45,
        fontSize: 11,
        color: "444444",
        fontFace: "Arial",
        italic: true,
      });

      const calloutRuns = [];
      for (const c of s.callouts || []) {
        const line = c.text ? `${c.label}\n${c.text}` : c.label;
        calloutRuns.push({
          text: `▸ ${line}\n`,
          options: {
            fontSize: 12,
            bold: true,
            color: c.color,
            fontFace: "Arial",
          },
        });
      }
      if (s.keyPoints) {
        slide.addText(
          s.keyPoints.map((k) => `• ${k}`).join("\n"),
          {
            x: textX,
            y: 2.15,
            w: textW,
            h: 1.5,
            fontSize: 10,
            color: "333333",
            fontFace: "Arial",
            valign: "top",
          },
        );
      } else if (calloutRuns.length) {
        slide.addText(calloutRuns, {
          x: textX,
          y: 2.15,
          w: textW,
          h: 2.0,
          valign: "top",
        });
      }

      if (s.footer) {
        slide.addText(s.footer, {
          x: 0.5,
          y: 5.0,
          w: 9,
          h: 0.3,
          fontSize: 10,
          italic: true,
          color: "888888",
          fontFace: "Arial",
        });
      }

      continue;
    }

    if (!s.studentBlock) {
      y = 1.05;
    }

    if (s.subtitle) {
      slide.addText(s.subtitle, {
        x: 0.5,
        y,
        w: 9,
        h: 0.32,
        fontSize: 15,
        color: "555555",
        italic: true,
        fontFace: "Arial",
      });
      y += 0.38;
    }

    if (s.richBody) {
      addRichText(slide, s.richBody, {
        x: 0.5,
        y,
        w: 9,
        h: 0.6,
        fontSize: 13,
        valign: "top",
      });
      y += 0.65;
    }

    y = renderPptxHeadExtras(slide, s, y);

    if (s.intro) {
      slide.addText(s.intro, {
        x: 0.5,
        y,
        w: 9,
        h: 0.45,
        fontSize: 16,
        color: "333333",
        fontFace: "Arial",
      });
      y += 0.55;
    }

    if (s.modes) {
      const modeRuns = [];
      for (const m of s.modes) {
        modeRuns.push({
          text: `${m.name}\n`,
          options: { fontSize: 16, bold: true, color: "0891B2", fontFace: "Arial" },
        });
        modeRuns.push({
          text: `${m.desc}\n\n`,
          options: { fontSize: 14, color: "333333", fontFace: "Arial" },
        });
      }
      slide.addText(modeRuns, { x: 0.5, y, w: 9, h: 2.8, valign: "top" });
      y += 3;
    }

    if (s.bullets && Array.isArray(s.bullets[0])) {
      const runs = [];
      for (const parts of s.bullets) {
        const line = Array.isArray(parts) ? parts : [parts];
        runs.push({ text: "• ", options: { fontSize: 15, color: "333333" } });
        for (const p of line) {
          runs.push({
            text: p.text,
            options: {
              fontSize: 15,
              bold: !!p.highlight,
              color: p.highlight ? "0891B2" : "333333",
              fontFace: "Arial",
            },
          });
        }
        runs.push({ text: "\n", options: { fontSize: 15 } });
      }
      slide.addText(runs, { x: 0.5, y, w: 9, h: 2.0, valign: "top", fontSize: 12 });
      y += 2.05;
      renderPptxTailExtras(slide, s, y);
    } else if (s.bullets && typeof s.bullets[0] === "string") {
      slide.addText(
        s.bullets.map((b) => `• ${b}`).join("\n"),
        { x: 0.5, y, w: 9, h: 2.5, fontSize: 15, color: "333333", fontFace: "Arial" },
      );
    }

    if (s.numbered) {
      const runs = [];
      if (s.intro) {
        runs.push({
          text: `${s.intro}\n\n`,
          options: { fontSize: 14, color: "333333", fontFace: "Arial" },
        });
      }
      s.numbered.forEach((n, i) => {
        runs.push({
          text: `${i + 1}. ${n.step}: `,
          options: { fontSize: 14, bold: true, color: "0891B2", fontFace: "Arial" },
        });
        runs.push({
          text: `${n.detail}\n`,
          options: { fontSize: 13, color: "333333", fontFace: "Arial" },
        });
        if (n.sub) {
          runs.push({
            text: `   ${n.sub}\n`,
            options: { fontSize: 11, italic: true, color: "666666", fontFace: "Arial" },
          });
        }
        runs.push({ text: "\n", options: { fontSize: 11 } });
      });
      slide.addText(runs, {
        x: 0.5,
        y: s.intro ? 1.35 : 1.15,
        w: 9,
        h: s.intro ? 3.6 : 3.8,
        valign: "top",
      });
      renderPptxTailExtras(slide, s, 4.75);
    }

    if (s.table) {
      const rows = [
        s.table.headers.map((h) => ({
          text: h,
          options: { bold: true, fill: "E8E8E3", color: "1a1a1a" },
        })),
        ...s.table.rows.map((row) =>
          row.map((cell, ci) => ({
            text: cell,
            options: {
              bold: ci === 2,
              color: ci === 2 ? "10B981" : "333333",
            },
          })),
        ),
      ];
      slide.addTable(rows, {
        x: 0.5,
        y: 1.15,
        w: 9,
        fontSize: 13,
        fontFace: "Arial",
        border: { type: "solid", color: "CCCCCC", pt: 0.5 },
        fill: "FFFFFF",
      });
      if (s.note) {
        slide.addText(s.note, {
          x: 0.5,
          y: 4.0,
          w: 9,
          h: 0.5,
          fontSize: 12,
          italic: true,
          color: "666666",
          fontFace: "Arial",
        });
      }
    }

    if (s.stack) {
      slide.addText(
        [
          { text: "Stack: ", options: { bold: true, fontSize: 15 } },
          ...s.stack.map((t, i) => ({
            text: (i ? ", " : "") + t,
            options: { fontSize: 14, color: "0891B2", bold: true },
          })),
        ],
        { x: 0.5, y: 1.15, w: 9, h: 0.6 },
      );
      slide.addText(
        s.bullets.map((b) => `• ${b}`).join("\n"),
        { x: 0.5, y: 1.85, w: 9, h: 2.2, fontSize: 14, color: "333333", fontFace: "Arial" },
      );
      slide.addText(
        [
          { text: "Goal: ", options: { bold: true, fontSize: 16, color: "1a1a1a" } },
          { text: s.goal, options: { bold: true, fontSize: 16, color: "0891B2" } },
        ],
        { x: 0.5, y: 4.2, w: 9, h: 0.5 },
      );
    }

    if (s.footer) {
      slide.addText(s.footer, {
        x: 0.5,
        y: 5.0,
        w: 9,
        h: 0.35,
        fontSize: 11,
        italic: true,
        color: "888888",
        fontFace: "Arial",
      });
    }
  }

  const filePath = path.join(outDir, "Click-Compress-Project-Slides.pptx");
  pptx.writeFile({ fileName: filePath });
  return filePath;
}

console.log("Generating snapshots…");
const snapshotPaths = await generateSnapshots();

console.log("Building documents…");
const docxPath = await buildDocx(snapshotPaths);

console.log("Building PPTX from Intership_Final.pptx template (preserves layout)…");
const mergeScript = path.join(__dirname, "merge-internship-template.py");
const merge = spawnSync("python3", [mergeScript], { stdio: "inherit" });
if (merge.status !== 0) {
  process.exit(merge.status ?? 1);
}
const pptxPath = path.join(outDir, "Click-Compress-Project-Slides.pptx");

console.log("Applying Times New Roman + page borders…");
const styleScript = path.join(__dirname, "style-pptx-borders-fonts.py");
const style = spawnSync("python3", [styleScript], { stdio: "inherit" });
if (style.status !== 0) {
  process.exit(style.status ?? 1);
}

console.log("Created:");
console.log(" ", docxPath);
console.log(" ", pptxPath);
console.log(" Snapshots:", snapshotPaths);
