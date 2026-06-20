export type SeoFaq = {
  question: string;
  answer: string;
};

export type SeoLandingPage = {
  slug: string;
  path: string;
  primaryKeyword: string;
  title: string;
  description: string;
  keywords: string[];
  h1: string;
  subhead: string;
  intro: string[];
  formats: string;
  savings: string;
  features: string[];
  steps: { title: string; body: string }[];
  faqs: SeoFaq[];
  relatedSlugs: string[];
};

export const SEO_LANDING_PAGES: SeoLandingPage[] = [
  {
    slug: "pdf-compressor",
    path: "/pdf-compressor",
    primaryKeyword: "PDF compressor",
    title: "Free Online PDF Compressor — Reduce PDF Size",
    description:
      "Compress PDF files online for free. Reduce PDF size by 30–50% with smart optimization — no signup required. Works on reports, scans, and ebooks.",
    keywords: [
      "pdf compressor",
      "compress pdf online",
      "reduce pdf size",
      "pdf file compressor free",
      "shrink pdf",
    ],
    h1: "Free Online PDF Compressor",
    subhead: "Reduce PDF file size without breaking your document.",
    intro: [
      "Click-Compress is a free PDF compressor that shrinks large PDFs for email, uploads, and sharing. Upload a report, scan, or ebook and download a smaller PDF in minutes.",
      "Our PDF pipeline runs multiple optimization passes and keeps the smallest valid output. On production, heavy PDFs use Ghostscript on a dedicated compression worker for stronger reduction.",
    ],
    formats: "PDF documents (reports, forms, scans, ebooks)",
    savings: "30–50% typical",
    features: [
      "Free — no account required to compress and download",
      "Smart PDF optimization with multiple passes",
      "Targets 40%+ savings on large documents",
      "Privacy-first: processing runs in your browser when possible",
      "Optional account to save compressed files securely",
    ],
    steps: [
      {
        title: "Upload your PDF",
        body: "Drag and drop or choose a PDF from your device. Files up to 25 MB use the cloud worker on clickcompress.com.",
      },
      {
        title: "Automatic optimization",
        body: "Click-Compress detects PDF content and applies the best compression profile for text, images, and embedded fonts.",
      },
      {
        title: "Download the smaller PDF",
        body: "See exact before/after size and savings percentage, then download your compressed PDF instantly.",
      },
    ],
    faqs: [
      {
        question: "How do I compress a PDF online for free?",
        answer:
          "Open the Click-Compress PDF compressor, upload your file, and click compress. Download the optimized PDF when processing finishes — no payment or signup required.",
      },
      {
        question: "Will PDF compression reduce quality?",
        answer:
          "PDF compression mainly downsamples large embedded images and removes redundant data. Text stays readable; photos may look slightly softer on aggressive settings.",
      },
      {
        question: "What is the maximum PDF size I can compress?",
        answer:
          "On clickcompress.com, PDFs up to 25 MB can use the cloud Ghostscript worker. Larger files may work locally when you run the app on your own machine.",
      },
      {
        question: "Is my PDF stored on your servers?",
        answer:
          "Compression runs with a local-first approach. Cloud worker uploads are processed and returned — they are not kept for marketing or training.",
      },
    ],
    relatedSlugs: ["video-compressor", "doc-compressor", "data-compressor"],
  },
  {
    slug: "video-compressor",
    path: "/video-compressor",
    primaryKeyword: "Video compressor",
    title: "Free Online Video Compressor — MP4, MOV & More",
    description:
      "Compress video files online for free. Reduce MP4, MOV, MKV, and WebM size with smart bitrate targeting. Ideal for WhatsApp, email, and social uploads.",
    keywords: [
      "video compressor",
      "compress video online",
      "mp4 compressor",
      "reduce video file size",
      "video file compressor free",
    ],
    h1: "Free Online Video Compressor",
    subhead: "Make MP4 and MOV files smaller for sharing and uploads.",
    intro: [
      "Click-Compress is a free video compressor for MP4, MOV, MKV, AVI, and WebM. Upload a clip from your phone or camera and download a smaller file that still plays everywhere.",
      "Our FFmpeg pipeline uses bitrate targeting and resolution caps so already-compressed clips (like WhatsApp videos) never get larger. High-bitrate originals can shrink 20–40% or more.",
    ],
    formats: "MP4, MOV, MKV, AVI, WebM, M4V",
    savings: "20–40% typical (up to 80% on high-bitrate sources)",
    features: [
      "Free online video compression — no watermark",
      "Bitrate-targeted encoding — output never larger than input",
      "720p cap for phone-friendly sharing sizes",
      "Real upload → compress → download progress",
      "Works with clips from WhatsApp, iPhone, and Android",
    ],
    steps: [
      {
        title: "Upload your video",
        body: "Choose MP4, MOV, or another supported format. Videos up to 25 MB use the GCP compression worker with FFmpeg.",
      },
      {
        title: "Smart re-encoding",
        body: "We analyze duration, resolution, and bitrate, then encode at a target size — or keep the original if it is already optimized.",
      },
      {
        title: "Download compressed MP4",
        body: "Get a smaller MP4 with fast-start enabled for smooth playback on phones and browsers.",
      },
    ],
    faqs: [
      {
        question: "How do I compress a video without losing too much quality?",
        answer:
          "Click-Compress uses bitrate targeting based on your file's existing quality. Heavily compressed clips are passed through unchanged; high-bitrate videos are re-encoded at a lower but still watchable bitrate.",
      },
      {
        question: "Can I compress MP4 files for WhatsApp?",
        answer:
          "Yes. Upload your MP4 and download a smaller version. If your video is already WhatsApp-compressed, we keep the original size instead of making it bigger.",
      },
      {
        question: "Which video formats are supported?",
        answer:
          "MP4, MOV, MKV, AVI, WebM, and M4V. Output is typically MP4 (H.264 + AAC) for maximum compatibility.",
      },
      {
        question: "Why did my video get larger on other compressors?",
        answer:
          "Re-encoding with fixed quality settings (CRF) can inflate already-compressed phone videos. Click-Compress caps bitrate and never returns a file larger than the upload.",
      },
    ],
    relatedSlugs: ["pdf-compressor", "data-compressor", "doc-compressor"],
  },
  {
    slug: "doc-compressor",
    path: "/doc-compressor",
    primaryKeyword: "Document compressor",
    title: "Free Document Compressor — Word, Excel & PowerPoint",
    description:
      "Compress DOCX, XLSX, PPTX, and ODT files online. Reduce Office document size with structure-aware lossless packing — free, fast, and browser-based.",
    keywords: [
      "doc compressor",
      "document compressor",
      "compress word document online",
      "compress docx",
      "office file compressor",
    ],
    h1: "Free Online Document Compressor",
    subhead: "Shrink Word, Excel, and PowerPoint files for email and uploads.",
    intro: [
      "Click-Compress is a free document compressor for DOCX, XLSX, PPTX, and ODT files. Office documents are ZIP archives packed with XML and media — we re-pack them with stronger lossless compression.",
      "Text-heavy documents often shrink 20–45%. Embedded images inside Word or PowerPoint files benefit from the same smart optimization used across the platform.",
    ],
    formats: "DOCX, XLSX, PPTX, ODT",
    savings: "20–45% typical",
    features: [
      "Compress Word (.docx) documents online",
      "Excel (.xlsx) and PowerPoint (.pptx) support",
      "Lossless structure-aware packing — content stays intact",
      "No Microsoft Office install required",
      "Runs in your browser for privacy",
    ],
    steps: [
      {
        title: "Upload your Office file",
        body: "Choose a .docx, .xlsx, .pptx, or .odt file from your computer.",
      },
      {
        title: "Structure-aware compression",
        body: "Click-Compress unpacks the document, optimizes inner parts, and re-pack with the smallest valid lossless strategy.",
      },
      {
        title: "Download the smaller document",
        body: "Open the compressed file in Word, Excel, or PowerPoint — content and formatting are preserved.",
      },
    ],
    faqs: [
      {
        question: "How do I compress a Word document online?",
        answer:
          "Upload your .docx file to Click-Compress, run compression, and download the optimized document. No Office subscription needed.",
      },
      {
        question: "Is document compression lossless?",
        answer:
          "Yes. Office document compression re-packs internal XML and assets without changing your text, formulas, or slides.",
      },
      {
        question: "Can I compress Excel and PowerPoint files too?",
        answer:
          "Yes. Click-Compress supports .xlsx and .pptx alongside .docx and OpenDocument (.odt) files.",
      },
      {
        question: "Does this work with Google Docs exports?",
        answer:
          "Export from Google Docs as .docx, then upload here. The compressor works on standard Office Open XML formats.",
      },
    ],
    relatedSlugs: ["pdf-compressor", "data-compressor", "video-compressor"],
  },
  {
    slug: "data-compressor",
    path: "/data-compressor",
    primaryKeyword: "Data compressor",
    title: "Free Data & Text File Compressor — CSV, JSON, XML",
    description:
      "Compress CSV, JSON, XML, TXT, and log files online for free. Lossless data compression with 50–90% savings on structured text — ideal for exports and datasets.",
    keywords: [
      "data compressor",
      "compress csv online",
      "compress json file",
      "text file compressor",
      "lossless data compression",
    ],
    h1: "Free Online Data & Text Compressor",
    subhead: "Losslessly shrink CSV, JSON, XML, and plain text files.",
    intro: [
      "Click-Compress is a free data compressor for structured text files — CSV exports, JSON APIs, XML configs, logs, Markdown, and HTML. Unlike zip tools, we optimize the file itself with maximum-effort lossless compression.",
      "Repetitive structured data often compresses 50–90%. Decompress anytime to get the exact original bytes back — perfect for archives, backups, and sharing large exports.",
    ],
    formats: "TXT, CSV, JSON, XML, HTML, Markdown, LOG",
    savings: "50–90% on structured text",
    features: [
      "Lossless compression — byte-perfect restore",
      "Deep compression for CSV, JSON, and XML",
      "Ideal for database exports and API dumps",
      "Browser-based — files stay on your device",
      "Works alongside PDF, video, and document tools",
    ],
    steps: [
      {
        title: "Upload your data file",
        body: "Choose CSV, JSON, XML, TXT, or another supported text format.",
      },
      {
        title: "Maximum-effort lossless pass",
        body: "Click-Compress tries multiple lossless strategies and keeps the smallest valid output.",
      },
      {
        title: "Download compressed file",
        body: "Share or store the smaller file. Decompress later to restore the exact original content.",
      },
    ],
    faqs: [
      {
        question: "What is a data compressor?",
        answer:
          "A data compressor reduces file size using lossless algorithms — the exact original can be restored. Click-Compress specializes in text and structured formats like CSV and JSON.",
      },
      {
        question: "Can I compress CSV and JSON files online?",
        answer:
          "Yes. Upload CSV or JSON exports and download a smaller losslessly compressed version, often half the size or less.",
      },
      {
        question: "Is data compression lossless?",
        answer:
          "Yes. Strict lossless mode preserves every byte. This is different from video or PDF optimization, which may trade some quality for size.",
      },
      {
        question: "How is this different from ZIP?",
        answer:
          "ZIP wraps files in an archive. Click-Compress optimizes the file content directly and can apply format-specific strategies for text-heavy data.",
      },
    ],
    relatedSlugs: ["doc-compressor", "pdf-compressor", "video-compressor"],
  },
];

export const SEO_LANDING_LINKS = SEO_LANDING_PAGES.map((page) => ({
  href: page.path,
  label: page.primaryKeyword,
}));

export function getSeoLandingPage(slug: string): SeoLandingPage | undefined {
  return SEO_LANDING_PAGES.find((page) => page.slug === slug);
}
