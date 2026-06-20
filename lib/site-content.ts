export const SITE = {
  name: "Click-Compress",
  brandWordmark: "CLICK-COMPRESS",
  logo: "/logo.png",
  logoIcon: "/logo-icon.png",
  tagline: "Smart compression for every file type",
  description:
    "Format-aware compression platform — target 40% savings with intelligent, local-first processing.",
} as const;

export const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/capabilities", label: "Capabilities" },
  { href: "/compress", label: "Compress" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/about", label: "About" },
  { href: "/downloads", label: "Slides" },
] as const;

export const STATS = [
  { value: "40%+", label: "Target savings" },
  { value: "6+", label: "File categories" },
  { value: "3", label: "Compression modes" },
  { value: "100%", label: "Local-first option" },
] as const;

export const CAPABILITIES = [
  {
    title: "Video",
    formats: "MP4, MOV, MKV, AVI",
    method: "Adaptive video encoding",
    savings: "40–80%",
    description:
      "Re-encodes video for smaller size while keeping playback compatible on phones and desktops.",
    icon: "video",
  },
  {
    title: "PDF",
    formats: "PDF documents",
    method: "Smart PDF optimization",
    savings: "30–50%",
    description:
      "Runs multiple optimization passes and picks the smallest valid output.",
    icon: "pdf",
  },
  {
    title: "Images",
    formats: "PNG, JPG, WebP, BMP, TIFF",
    method: "Quality-aware re-encoding",
    savings: "35–60%",
    description:
      "Progressive quality and scale steps toward your size target.",
    icon: "image",
  },
  {
    title: "Documents",
    formats: "DOCX, XLSX, PPTX, ODT",
    method: "Structure-aware packing",
    savings: "20–45%",
    description:
      "Packs office files with the best lossless strategy for text-heavy content.",
    icon: "doc",
  },
  {
    title: "Text & data",
    formats: "TXT, JSON, CSV, XML, HTML, MD",
    method: "Maximum-effort lossless",
    savings: "50–90%",
    description:
      "Deep compression for structured and plain text files.",
    icon: "text",
  },
  {
    title: "Archives",
    formats: "Compressed wrappers, generic binaries",
    method: "Unpack → re-optimize",
    savings: "Varies",
    description:
      "Decompresses wrapper formats, detects inner content type, then applies the right optimizer.",
    icon: "archive",
  },
] as const;

export const MODES = [
  {
    id: "target-40",
    name: "Target 40% savings",
    summary: "Recommended for most files. Uses smart re-encoding when needed to hit the size goal.",
  },
  {
    id: "high-impact-local",
    name: "High impact local",
    summary:
      "Best for video and PDF. Uses the strongest local processing path for maximum reduction.",
  },
  {
    id: "strict-lossless",
    name: "Strict lossless",
    summary:
      "Byte-perfect restore. Tries multiple lossless strategies and picks the smallest valid output.",
  },
] as const;

export const STEPS = [
  {
    step: "01",
    title: "Upload",
    body: "Choose any supported file. Set your goal, mode, and optimization profile.",
  },
  {
    step: "02",
    title: "Analyze",
    body: "The platform detects file type and routes it to the best compression path.",
  },
  {
    step: "03",
    title: "Compress",
    body: "Processing runs locally. Heavy formats use the high-impact path; lighter files stay in-browser.",
  },
  {
    step: "04",
    title: "Download",
    body: "Get your optimized file with savings stats and a clear summary of what was applied.",
  },
] as const;
