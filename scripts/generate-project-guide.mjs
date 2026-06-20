#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const MD_SRC = path.join(ROOT, "docs/Click-Compress-Project-Technical-Guide.md");
const OUT_DIR = path.join(ROOT, "public/downloads");
const BASE = "Click-Compress-Project-Technical-Guide";

function escapeHtml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Minimal markdown → HTML (headings, tables, lists, code, paragraphs). */
function markdownToHtml(md) {
  const lines = md.split("\n");
  const out = [];
  let i = 0;
  let inCode = false;
  let inTable = false;
  let tableRows = [];

  const flushTable = () => {
    if (tableRows.length === 0) return;
    out.push('<table class="data-table">');
    tableRows.forEach((row, ri) => {
      const tag = ri === 0 ? "th" : "td";
      out.push("<tr>");
      row.forEach((cell) => {
        out.push(`<${tag}>${inlineFormat(cell.trim())}</${tag}>`);
      });
      out.push("</tr>");
    });
    out.push("</table>");
    tableRows = [];
    inTable = false;
  };

  function inlineFormat(text) {
    let t = escapeHtml(text);
    t = t.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    t = t.replace(/`([^`]+)`/g, "<code>$1</code>");
    return t;
  }

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("```")) {
      if (inCode) {
        out.push("</code></pre>");
        inCode = false;
      } else {
        flushTable();
        out.push('<pre class="code-block"><code>');
        inCode = true;
      }
      i += 1;
      continue;
    }

    if (inCode) {
      out.push(`${escapeHtml(line)}\n`);
      i += 1;
      continue;
    }

    if (line.startsWith("|") && line.includes("|")) {
      if (/^\|[\s\-:|]+\|$/.test(line.trim())) {
        i += 1;
        continue;
      }
      inTable = true;
      const cells = line
        .split("|")
        .slice(1, -1)
        .map((c) => c.trim());
      tableRows.push(cells);
      i += 1;
      continue;
    }

    flushTable();

    if (line.startsWith("# ")) {
      out.push(`<h1>${inlineFormat(line.slice(2))}</h1>`);
    } else if (line.startsWith("## ")) {
      out.push(`<h2>${inlineFormat(line.slice(3))}</h2>`);
    } else if (line.startsWith("### ")) {
      out.push(`<h3>${inlineFormat(line.slice(4))}</h3>`);
    } else if (line.startsWith("- ")) {
      out.push(`<ul><li>${inlineFormat(line.slice(2))}</li>`);
      i += 1;
      while (i < lines.length && lines[i].startsWith("- ")) {
        out.push(`<li>${inlineFormat(lines[i].slice(2))}</li>`);
        i += 1;
      }
      out.push("</ul>");
      continue;
    } else if (line.trim() === "---") {
      out.push("<hr />");
    } else if (line.trim() === "") {
      // skip
    } else {
      out.push(`<p>${inlineFormat(line)}</p>`);
    }
    i += 1;
  }

  flushTable();
  if (inCode) out.push("</code></pre>");

  return out.join("\n");
}

function buildHtmlDocument(bodyHtml) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Click-Compress — Project Technical Guide</title>
  <style>
    @page { margin: 18mm 16mm; }
    body {
      font-family: "Times New Roman", Times, serif;
      font-size: 11pt;
      line-height: 1.45;
      color: #111;
      max-width: 210mm;
      margin: 0 auto;
      padding: 12mm;
    }
    h1 { font-size: 22pt; border-bottom: 2px solid #0891b2; padding-bottom: 6px; margin-top: 0; }
    h2 { font-size: 15pt; color: #0e7490; margin-top: 22px; page-break-after: avoid; }
    h3 { font-size: 12pt; margin-top: 14px; }
    p { margin: 8px 0; text-align: justify; }
    code { font-family: Consolas, monospace; font-size: 9.5pt; background: #f4f4f5; padding: 1px 4px; border-radius: 3px; }
    pre.code-block {
      background: #18181b;
      color: #e4e4e7;
      padding: 10px 12px;
      border-radius: 6px;
      font-size: 9pt;
      overflow-x: auto;
      white-space: pre-wrap;
    }
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0;
      font-size: 10pt;
      page-break-inside: avoid;
    }
    table.data-table th, table.data-table td {
      border: 1px solid #d4d4d8;
      padding: 6px 8px;
      text-align: left;
      vertical-align: top;
    }
    table.data-table th { background: #ecfeff; font-weight: bold; }
    ul { margin: 8px 0 8px 20px; }
    li { margin: 4px 0; }
    hr { border: none; border-top: 1px solid #ccc; margin: 20px 0; }
    strong { color: #000; }
  </style>
</head>
<body>
${bodyHtml}
</body>
</html>`;
}

function printHtmlToPdf(htmlPath, pdfPath) {
  const chromePaths = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
  ];

  for (const chrome of chromePaths) {
    if (!fs.existsSync(chrome)) continue;
    const result = spawnSync(
      chrome,
      [
        "--headless",
        "--disable-gpu",
        "--no-pdf-header-footer",
        `--print-to-pdf=${pdfPath}`,
        `file://${htmlPath}`,
      ],
      { encoding: "utf8", timeout: 120_000 },
    );
    if (result.status === 0 && fs.existsSync(pdfPath)) {
      return true;
    }
  }
  return false;
}

function main() {
  if (!fs.existsSync(MD_SRC)) {
    console.error("Missing:", MD_SRC);
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const md = fs.readFileSync(MD_SRC, "utf8");
  const mdOut = path.join(OUT_DIR, `${BASE}.md`);
  const htmlOut = path.join(OUT_DIR, `${BASE}.html`);
  const pdfOut = path.join(OUT_DIR, `${BASE}.pdf`);

  fs.writeFileSync(mdOut, md, "utf8");
  const html = buildHtmlDocument(markdownToHtml(md));
  fs.writeFileSync(htmlOut, html, "utf8");

  console.log("Wrote:", mdOut);
  console.log("Wrote:", htmlOut);

  if (printHtmlToPdf(path.resolve(htmlOut), pdfOut)) {
    const kb = (fs.statSync(pdfOut).size / 1024).toFixed(1);
    console.log(`Wrote: ${pdfOut} (${kb} KB)`);
    return;
  }

  console.warn(
    "Could not auto-generate PDF (Chrome/Chromium headless not found).",
  );
  console.warn("Open the HTML file in a browser → Print → Save as PDF:");
  console.warn(" ", htmlOut);
}

main();
