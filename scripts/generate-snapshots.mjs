#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const snapDir = path.join(__dirname, "..", "public", "downloads", "snapshots");
fs.mkdirSync(snapDir, { recursive: true });

function esc(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function renderSvg(name, svg) {
  const out = path.join(snapDir, name);
  await sharp(Buffer.from(svg)).png().toFile(out);
  return out;
}

/** Mock of real video compression result from the platform */
export async function generateSnapshots() {
  const videoResult = `
<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540">
  <rect width="960" height="540" fill="#000000"/>
  <text x="480" y="44" text-anchor="middle" fill="#a1a1aa" font-family="Arial, sans-serif" font-size="14">Click-Compress · Compression workbench</text>
  <rect x="80" y="70" width="800" height="400" rx="20" fill="#18181b" stroke="#3f3f46" stroke-width="1"/>
  <text x="110" y="115" fill="#71717a" font-family="Arial" font-size="11" font-weight="bold">METHOD</text>
  <text x="110" y="145" fill="#ffffff" font-family="Arial" font-size="22">video-hevc-hvc1</text>
  <text x="750" y="115" fill="#34d399" font-family="Arial" font-size="11" font-weight="bold" text-anchor="end">SAVED</text>
  <text x="750" y="155" fill="#34d399" font-family="Arial" font-size="42" font-weight="bold" text-anchor="end">80.5%</text>
  <rect x="110" y="175" width="200" height="28" rx="14" fill="#27272a"/>
  <text x="125" y="194" fill="#d4d4d8" font-family="Arial" font-size="13">26.34 MB → 5.15 MB</text>
  <rect x="330" y="175" width="220" height="28" rx="14" fill="#052e16" stroke="#166534"/>
  <text x="345" y="194" fill="#34d399" font-family="Arial" font-size="13">Target hit (≥40% saved)</text>
  <text x="110" y="240" fill="#a1a1aa" font-family="Arial" font-size="14">${esc("Video transcoded to H.265 (hvc1 tag) + AAC — optimized for QuickTime and iOS.")}</text>
  <text x="110" y="275" fill="#71717a" font-family="Arial" font-size="12">File: WhatsApp Video 2026-05-09 at 11.59.05.mp4</text>
  <rect x="110" y="310" width="680" height="48" rx="12" fill="#ffffff"/>
  <text x="450" y="340" text-anchor="middle" fill="#000000" font-family="Arial" font-size="15" font-weight="bold">Download compressed.mp4</text>
</svg>`;

  const workbench = `
<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540">
  <rect width="960" height="540" fill="#000000"/>
  <text x="480" y="50" text-anchor="middle" fill="#ffffff" font-family="Arial" font-size="26" font-weight="bold">Compression workbench</text>
  <text x="480" y="78" text-anchor="middle" fill="#a1a1aa" font-family="Arial" font-size="14">Target 40% savings with format-aware re-encoding</text>
  <rect x="180" y="110" width="600" height="360" rx="24" fill="#18181b" stroke="#3f3f46"/>
  <text x="210" y="155" fill="#d4d4d8" font-family="Arial" font-size="13" font-weight="bold">Choose file</text>
  <rect x="210" y="170" width="540" height="36" rx="8" fill="#0a0a0a" stroke="#52525b"/>
  <text x="225" y="193" fill="#a1a1aa" font-family="Arial" font-size="12">WhatsApp Video 2026-05-09 at 11.59.05.mp4 (26.34 MB)</text>
  <text x="210" y="235" fill="#d4d4d8" font-family="Arial" font-size="13" font-weight="bold">Compression goal</text>
  <rect x="210" y="250" width="540" height="32" rx="8" fill="#0a0a0a" stroke="#52525b"/>
  <text x="225" y="270" fill="#c4b5fd" font-family="Arial" font-size="12">High impact local (ffmpeg / Ghostscript)</text>
  <rect x="210" y="310" width="540" height="44" rx="12" fill="#ffffff"/>
  <text x="480" y="338" text-anchor="middle" fill="#000" font-family="Arial" font-size="15" font-weight="bold">Compress</text>
</svg>`;

  const home = `
<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540">
  <rect width="960" height="540" fill="#000000"/>
  <text x="480" y="120" text-anchor="middle" fill="#22d3ee" font-family="Arial" font-size="13">INTELLIGENT COMPRESSION PLATFORM</text>
  <text x="480" y="175" text-anchor="middle" fill="#ffffff" font-family="Arial" font-size="36" font-weight="bold">Shrink files smarter.</text>
  <text x="480" y="220" text-anchor="middle" fill="#71717a" font-family="Arial" font-size="28">Not just smaller — optimized.</text>
  <text x="480" y="280" text-anchor="middle" fill="#a1a1aa" font-family="Arial" font-size="15">Video · PDF · Images · Documents · 40%+ target savings</text>
  <rect x="340" y="320" width="140" height="44" rx="10" fill="#ffffff"/>
  <text x="410" y="348" text-anchor="middle" fill="#000" font-family="Arial" font-size="14" font-weight="bold">Compress a file</text>
  <rect x="490" y="320" width="130" height="44" rx="10" fill="none" stroke="#52525b"/>
  <text x="555" y="348" text-anchor="middle" fill="#fff" font-family="Arial" font-size="14">Capabilities</text>
  <rect x="120" y="400" width="170" height="70" rx="12" fill="#18181b" stroke="#3f3f46"/>
  <text x="205" y="435" text-anchor="middle" fill="#fff" font-family="Arial" font-size="22" font-weight="bold">40%+</text>
  <text x="205" y="455" text-anchor="middle" fill="#71717a" font-family="Arial" font-size="11">Target savings</text>
  <rect x="310" y="400" width="170" height="70" rx="12" fill="#18181b" stroke="#3f3f46"/>
  <text x="395" y="435" text-anchor="middle" fill="#fff" font-family="Arial" font-size="22" font-weight="bold">6+</text>
  <text x="395" y="455" text-anchor="middle" fill="#71717a" font-family="Arial" font-size="11">File categories</text>
  <rect x="500" y="400" width="170" height="70" rx="12" fill="#18181b" stroke="#3f3f46"/>
  <text x="585" y="435" text-anchor="middle" fill="#fff" font-family="Arial" font-size="22" font-weight="bold">3</text>
  <text x="585" y="455" text-anchor="middle" fill="#71717a" font-family="Arial" font-size="11">Compression modes</text>
  <rect x="690" y="400" width="170" height="70" rx="12" fill="#18181b" stroke="#3f3f46"/>
  <text x="775" y="435" text-anchor="middle" fill="#fff" font-family="Arial" font-size="22" font-weight="bold">100%</text>
  <text x="775" y="455" text-anchor="middle" fill="#71717a" font-family="Arial" font-size="11">Local-first option</text>
</svg>`;

  const paths = {
    videoResult: await renderSvg("snapshot-video-result.png", videoResult),
    workbench: await renderSvg("snapshot-workbench.png", workbench),
    home: await renderSvg("snapshot-home.png", home),
    edutainerDashboard: path.join(snapDir, "edutainer-dashboard.png"),
    edutainerInternships: path.join(snapDir, "edutainer-internships.png"),
  };

  return paths;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const p = await generateSnapshots();
  console.log("Snapshots:", p);
}
