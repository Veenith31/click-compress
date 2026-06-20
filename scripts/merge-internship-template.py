#!/usr/bin/env python3
"""
Build Click-Compress-Project-Slides.pptx from Intership_Final.pptx template.
Preserves fonts, layouts, colors, and slide structure from the internship deck.
"""

from __future__ import annotations

import re
import shutil
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TEMPLATE = ROOT / "public/downloads/templates/Intership_Final.pptx"
FALLBACK_TEMPLATE = Path.home() / "Downloads/Intership_Final.pptx"
OUT_PPTX = ROOT / "public/downloads/Click-Compress-Project-Slides.pptx"

SLIDE_REL_TYPE = (
    "http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide"
)
SLIDE_CONTENT_TYPE = (
    "application/vnd.openxmlformats-officedocument.presentationml.slide+xml"
)
AT_TEXT_RE = re.compile(r"(<a:t(?:\s[^>]*)?>)([^<]*)(</a:t>)")

# Same node count as template per slide — order matches document <a:t> traversal.
INTERNSHIP_TEXTS: dict[int, list[str]] = {
    1: [
        "Junior Software developer Intern",
        "Presented by: Veenith Kumar S",
        "USN: 1BI24MC159",
        "Internal guide:",
        "Prof. Seema Nagaraj",
        "Asst. Professor",
        ",",
        "Dept. of MCA",
        "Bangalore Institute of Technology",
    ],
    2: [
        "PAT Technologies Private Limited (Edutainer)",
        "Technology-oriented training and learning organization (Bengaluru).",
        "Provides industry-focused programs in web development, Python, and cyber security.",
        "Focuses on practical learning, weekly progress, and hands-on project experience.",
        "Helps students bridge the gap between academics and industry requirements.",
        "Offers training in React Full Stack, Python Programming, and Cyber Security.",
        "External guide: Bunty Deb, Program Manager · MINT483 · VTU 2025–2026.",
        "About the Company",
    ],
    3: [
        "Internship Overview",
        "12-week Junior Software Developer Internship at Edutainer (PAT Technologies Pvt Ltd).",
        "Covered HTML, CSS, Bootstrap, React JS, Python, networking, and cybersecurity.",
        "Built responsive UIs, practiced API integration, routing, hooks, and CRUD workflows.",
        "Completed Python mini projects (Student Management, Banking) with OOP and multithreading.",
        "Studied network topologies, VPN, firewalls, IPS, malware, and DLP fundamentals.",
        "Maintained weekly progress reports, quizzes, and mentor-reviewed assignments.",
        "Major deliverable: Click-Compress — Smart Data Compression Platform (Next.js).",
    ],
    4: [
        "Objectives of Internship",
        "Understand full-stack web development with React and modern JavaScript.",
        "Learn Python programming, data structures, and application logic.",
        "Apply networking and enterprise cybersecurity concepts in practice.",
        "Develop the Click-Compress compression platform as the capstone project.",
        "Document test cases, compression metrics, and UI workflows.",
        "Use industry tools: VS Code, Node.js, Git, ffmpeg, and Ghostscript.",
        "Improve debugging, analytical thinking, and technical communication.",
        "Deliver measurable compression results (PDF, video, CSV, images).",
        "Present outcomes aligned with VTU internship requirements (MINT483).",
    ],
    5: [
        "Tools and Technologies Used",
        "React.js / Frontend",
        "Python / Backend",
        "HTML, CSS, Bootstrap",
        "Next.js & TypeScript",
        "React Hooks & Router",
        "API fetch / CRUD",
        "VS Code, Node.js, Git",
        "ffmpeg / Ghostscript",
        "Cyber Security",
        "Compression stack",
        "Brotli, Gzip, RLE, LZW",
        "brotli-wasm, fflate",
        "Browser & server actions",
        "ffprobe validation",
        "Network & security labs",
        "Edutainer LMS portal",
        "Weekly reports & quizzes",
        "Test-case documentation",
        "Click-Compress deployment",
    ],
    6: [
        "Topics Covered",
        "Web Development (HTML, CSS, Bootstrap, React)",
        "Python Programming & OOP",
        "Networking Fundamentals",
        "Cyber Security & Ethical Practices",
        "Smart Data Compression (Click-Compress)",
        "API Handling and Full-Stack Workflow",
        "ffmpeg / Ghostscript Media Pipelines",
        "Lossless vs Lossy Compression Modes",
        "Project Documentation & Testing",
    ],
    7: [
        "React Full Stack Web Development",
        "React.js",
        "Built interactive UIs with components, props, state, and hooks.",
        "Practiced React Router, forms, validation, and API-driven CRUD screens.",
        "Concepts Learned",
        "Components and Props",
        "State and Hooks",
        "Event Handling",
        "Routing and Navigation",
        "API Integration",
        "Responsive Web Design",
        "Applications",
        "Edutainer coursework UIs",
        "Dashboard-style layouts",
        "Single Page Applications (SPA)",
        "Click-Compress marketing & workbench pages",
    ],
    8: [
        "Python Programming",
        "Python",
        "Applied loops, functions, OOP, file handling, and multithreading.",
        "Completed Student Management and Banking mini projects.",
        "Concepts Learned",
        "Variables and Data Types",
        "Conditional Statements",
        "Loops and Functions",
        "File Handling",
        "Exception Handling",
        "Object-Oriented Programming",
        "Applications",
        "Automation scripts",
        "Backend logic exercises",
        "Data processing tasks",
        "Supporting compression utilities",
    ],
    9: [
        "Cyber Security and Networking",
        "Cyber Security",
        "Studied threats, authentication, firewalls, IPS, VPN, and secure practices.",
        "Explored malware, DLP, and risk assessment in enterprise contexts.",
        "Networking",
        "Topologies, wireless security, and secure infrastructure basics.",
        "Topics Learned",
        "Network Security Basics",
        "Types of Cyber Attacks",
        "Password and Authentication Security",
        "Risk Assessment",
        "Vulnerability Awareness",
        "Ethical and Responsible Security Practices",
    ],
    10: [
        "Tasks Performed",
        "Web & React Activities",
        "Built responsive pages with Bootstrap and React components.",
        "Implemented routing, hooks, API fetch, and form validation.",
        "Practiced debugging and UI optimization on coursework projects.",
        "Python Activities",
        "Developed mini projects with OOP and multithreading.",
        "Practiced file handling, logic building, and scripting.",
        "Security Activities",
        "Completed networking and cybersecurity modules with assessments.",
        "Major Project — Click-Compress",
        "Designed format-aware compression (video, PDF, images, office, text).",
        "Ran 35 test cases; documented PDF 86%, video 67.6%, CSV 83.3% savings.",
    ],
    11: [
        "Weekly Progress",
        "Weeks 1–4",
        "Weeks 5–8",
        "Weeks 9–12",
        "Web & React",
        "Python",
        "Networking & Security",
        "Click-Compress Project",
        "• HTML, CSS, Bootstrap fundamentals",
        "• Python syntax, loops, and functions",
        "• Network topologies and security basics",
        "• Next.js app setup and routing",
        "• React components, props, and hooks",
        "• OOP, file handling, mini projects",
        "• Firewalls, VPN, IPS, malware, DLP",
        "• Compression dispatcher & workbench UI",
        "• API integration and CRUD exercises",
        "• Multithreading and banking mini project",
        "• Ethical hacking & risk assessment labs",
        "• ffmpeg / Ghostscript video & PDF pipelines",
        "• Responsive layouts and debugging",
        "• Weekly quizzes and mentor reviews",
        "• Secure coding practices",
        "• Brotli/Gzip lossless modes & metrics panel",
        "• Student Management System project",
        "• Progress documentation (MINT483)",
        "• Test cases, snapshots, and final report",
        "• Internship presentation & demo",
    ],
    12: [
        "Learning Outcomes",
        "Development & Programming",
        "Gained practical React and full-stack web development skills.",
        "Strengthened Python programming, OOP, and problem-solving.",
        "Built and deployed the Click-Compress compression platform.",
        "Compression & Engineering",
        "Learned format-specific pipelines (ffmpeg, Ghostscript, Brotli).",
        "Validated outputs with ffprobe and honest savings reporting.",
        "Security & Analysis",
        "Understood networking, cyber threats, and risk assessment basics.",
        "Professional Skills",
        "Improved documentation, weekly reporting, and mentor collaboration.",
        "Ready for industry-oriented software development roles.",
    ],
    13: [
        "Challenges Faced",
        "Frontend & Backend Challenges",
        "Balancing React state, routing, and API integration on early tasks.",
        "Tuning Python programs for correctness and performance.",
        "Compression Challenges",
        "Achieving QuickTime-safe H.265 (hvc1) video output.",
        "Handling large uploads within server-action size limits.",
        "General Learning & Technical Challenges",
        "Learning web, Python, security, and compression in parallel.",
        "Resolving ffmpeg/Ghostscript PATH issues in local dev.",
        "Choosing lossy vs lossless modes per file type.",
    ],
    14: [
        "Conclusion",
        "Technical Exposure",
        "Completed Edutainer internship with web, Python, security, and project work.",
        "Delivered Click-Compress — a production-style Next.js compression platform.",
        "Skills Improved",
        "Improved full-stack development, debugging, and analytical skills.",
        "Compression & Professional Growth",
        "Demonstrated real savings on PDF, video, CSV, and image test files.",
        "Gained confidence presenting technical work for VTU MCA (USN 1BI24MC159).",
        "Thank you — Prof. Seema Nagaraj (BIT) & Bunty Deb (Edutainer).",
    ],
}

# Platform section inserted before THANK YOU — (layout_slide, texts[])
PLATFORM_SLIDES: list[tuple[int, list[str]]] = [
    (
        3,
        [
            "Major Project — Click-Compress",
            "Capstone during internship: Smart Data Compression Platform (Next.js + TypeScript).",
            "Student: Veenith Kumar S · USN 1BI24MC159 · Bangalore Institute of Technology.",
            "Format-aware engine: video (ffmpeg H.264/H.265), PDF (Ghostscript), images, office ZIP.",
            "Browser path: Brotli-wasm, WebP/JPEG sweeps, fflate; server actions up to 100 MB.",
            "Modes: Target 40%, High impact local, Strict lossless (Brotli/Gzip/RLE/LZW).",
            "Test results: PDF 86% saved, video 67.6%, CSV 83.3% (documented in report).",
            "35 test cases for upload, compression, UI, and security workflows.",
        ],
    ),
    (
        3,
        [
            "Click-Compress — Platform Overview",
            "Format-aware web platform — not a generic zip tool.",
            "Shrinks video, PDF, images, and documents using the right codec per file.",
            "Full-stack Next.js: Home, Capabilities, Compress, How it works, About, Downloads.",
            "Target ~40% savings with honest metrics when files are already dense.",
            "Three goals: Target 40%, High impact local, Strict lossless.",
            "Demo: 26.34 MB WhatsApp video → 5.15 MB (80.5% saved, QuickTime-safe).",
            "Privacy: browser + local-server processing — no third-party API.",
        ],
    ),
    (
        4,
        [
            "The Problem",
            "Files too large for email, LMS, messaging, and cloud upload limits.",
            "Generic compressors use one algorithm — ZIP/Gzip — poor on MP4, PDF, JPG.",
            "Share & upload limits block phone videos and coursework attachments.",
            "Cloud-only tools require uploading sensitive documents.",
            "Aggressive encoding can break QuickTime playback or PDF layout.",
            "Users want ~40% reduction but only see \"done\" without clear metrics.",
            "Lossy vs lossless is confusing without guided modes.",
            "Gap: format-specific, trustworthy compression is needed.",
            "Click-Compress addresses each of these pain points.",
        ],
    ),
    (
        3,
        [
            "Our Solution",
            "Dispatcher routes each upload to a specialized pipeline by MIME and extension.",
            "Target 40% — re-encode when needed to hit size goals (recommended).",
            "High impact local — ffmpeg + Ghostscript on the machine for video & PDF.",
            "Strict lossless — Brotli, Gzip, RLE, LZW with exact byte restore.",
            "Browser-first for images & text; native engines for heavy media.",
            "Picks smallest valid output (e.g. H.264 vs H.265 for QuickTime).",
            "Results panel shows method, sizes, savings %, and target hit.",
        ],
    ),
    (
        5,
        [
            "What We Compress",
            "Video / ffmpeg",
            "PDF / Ghostscript",
            "MP4, MOV, MKV",
            "/ebook + /screen",
            "H.264 & H.265 (hvc1)",
            "30–50% typical",
            "Images / canvas",
            "Office & text",
            "WebP / JPEG sweep",
            "Brotli Q11 / Gzip",
            "35–60% typical",
            "20–90% typical",
            "40–80% video",
            "QuickTime-safe tags",
            "Dispatcher validation",
            "ffprobe on video",
            "Round-trip lossless",
            "Smallest valid wins",
            "Honest reporting",
        ],
    ),
    (
        4,
        [
            "How It Works",
            "1. Upload — workbench; pick goal, mode (Fast/Balanced/Max), profile.",
            "2. Analyze — dispatcher reads MIME, extension, structure.",
            "3. Compress — ffmpeg, Ghostscript, Brotli-wasm, canvas, fflate.",
            "4. Validate — ffprobe, round-trip lossless, QuickTime-safe tags.",
            "5. Download — optimized file + savings metrics panel.",
            "Browser path → images, text, JSON, CSV, strict-lossless archives.",
            "Native path → MP4/MOV video, PDF, JPEG/PNG via local binaries.",
            "Fallback → ffmpeg.wasm in-browser if native ffmpeg unavailable.",
            "Up to 100 MB server-action limit for large video uploads.",
            "Simple UX on the surface · specialized engines underneath.",
        ],
    ),
    (
        3,
        [
            "Result Snapshot — Video",
            "Real test: WhatsApp video 26.34 MB → 5.15 MB compressed.",
            "80.5% saved — exceeds 40% target.",
            "QuickTime-safe H.265 with hvc1 tag and yuv420p.",
            "Dual pass: H.264 and H.265; smallest valid output selected.",
            "ffprobe validation before download.",
            "High impact local mode on Compress workbench.",
            "Media profile with Balanced / Max quality options.",
        ],
    ),
    (
        3,
        [
            "Platform Snapshot — Workbench & Home",
            "Compression workbench: drag-drop upload, goal selector, one-click compress.",
            "Profiles: Smart, Text, Media — tuned dispatcher hints.",
            "Marketing home: stats, capability cards, navigation to all sections.",
            "Shows original vs compressed size and method name.",
            "Highlights 40%+ target and 6+ file categories.",
            "Downloads page ships this deck and project documentation.",
            "Live app: npm run dev · generate:deck for materials.",
        ],
    ),
    (
        12,
        [
            "Technology & Summary",
            "Stack",
            "Next.js, TypeScript, brotli-wasm, fflate, ffmpeg, Ghostscript.",
            "Site map",
            "Home, Capabilities, Compress, How it works, About, Downloads.",
            "Features",
            "100 MB server actions · honest metrics · multi-algorithm lossless.",
            "Internship",
            "Veenith Kumar S · 1BI24MC159 · BIT · Edutainer · MINT483.",
            "Goal",
            "Make large files smaller, playable, and shareable — simply.",
            "Professional Skills",
            "Delivered end-to-end capstone with documented test evidence.",
            "Ready for industry-oriented software development roles.",
        ],
    ),
]


def xml_escape(text: str) -> str:
    return (
        text.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


def apply_texts(xml_path: Path, texts: list[str]) -> None:
    """Replace <a:t> contents in place — preserves p:/a: namespaces (PowerPoint-safe)."""
    data = xml_path.read_text(encoding="utf-8")
    idx = 0

    def repl(match: re.Match[str]) -> str:
        nonlocal idx
        if idx >= len(texts):
            return match.group(0)
        out = f"{match.group(1)}{xml_escape(texts[idx])}{match.group(3)}"
        idx += 1
        return out

    updated = AT_TEXT_RE.sub(repl, data)
    if idx != len(texts):
        raise ValueError(
            f"{xml_path.name}: expected {len(texts)} text nodes, updated {idx}",
        )
    xml_path.write_text(updated, encoding="utf-8")


def pad_texts(texts: list[str], count: int) -> list[str]:
    out = list(texts)
    while len(out) < count:
        out.append("")
    return out[:count]


def count_text_nodes(xml_path: Path) -> int:
    return len(AT_TEXT_RE.findall(xml_path.read_text(encoding="utf-8")))


def clone_slide_files(work: Path, src_num: int, dest_num: int) -> None:
    slides = work / "ppt/slides"
    rels = slides / "_rels"
    notes = work / "ppt/notesSlides"
    notes_rels = notes / "_rels"

    shutil.copy2(slides / f"slide{src_num}.xml", slides / f"slide{dest_num}.xml")
    shutil.copy2(rels / f"slide{src_num}.xml.rels", rels / f"slide{dest_num}.xml.rels")
    if (notes / f"notesSlide{src_num}.xml").exists():
        shutil.copy2(notes / f"notesSlide{src_num}.xml", notes / f"notesSlide{dest_num}.xml")
    if (notes_rels / f"notesSlide{src_num}.xml.rels").exists():
        shutil.copy2(
            notes_rels / f"notesSlide{src_num}.xml.rels",
            notes_rels / f"notesSlide{dest_num}.xml.rels",
        )


def rebuild_presentation(work: Path, slide_count: int) -> None:
    """Update package relationships without rewriting XML namespaces."""
    rels_path = work / "ppt/_rels/presentation.xml.rels"
    rels_text = rels_path.read_text(encoding="utf-8")

    max_rid = 0
    for m in re.finditer(r'Id="rId(\d+)"', rels_text):
        max_rid = max(max_rid, int(m.group(1)))

    slide_rids: list[str] = []
    new_rels: list[str] = []
    for n in range(1, slide_count + 1):
        max_rid += 1
        rid = f"rId{max_rid}"
        slide_rids.append(rid)
        new_rels.append(
            f'<Relationship Id="{rid}" Type="{SLIDE_REL_TYPE}" '
            f'Target="slides/slide{n}.xml"/>',
        )

    rels_no_slides = re.sub(
        r'<Relationship[^>]+' + re.escape(SLIDE_REL_TYPE) + r'[^>]*/>',
        "",
        rels_text,
    )
    rels_new = rels_no_slides.replace(
        "</Relationships>",
        "".join(new_rels) + "</Relationships>",
    )
    if rels_new == rels_text:
        raise RuntimeError("presentation.xml.rels: could not inject slide relationships")
    rels_path.write_text(rels_new, encoding="utf-8")

    pres_path = work / "ppt/presentation.xml"
    pres = pres_path.read_text(encoding="utf-8")
    base_id = 256
    sld_entries = "".join(
        f'<p:sldId id="{base_id + n}" r:id="{slide_rids[n - 1]}"/>'
        for n in range(1, slide_count + 1)
    )
    new_lst = f"<p:sldIdLst>{sld_entries}</p:sldIdLst>"
    pres_new, n = re.subn(
        r"<p:sldIdLst>.*?</p:sldIdLst>",
        new_lst,
        pres,
        count=1,
        flags=re.DOTALL,
    )
    if n != 1:
        raise RuntimeError("presentation.xml: sldIdLst not found")
    pres_path.write_text(pres_new, encoding="utf-8")

    ct_path = work / "[Content_Types].xml"
    ct = ct_path.read_text(encoding="utf-8")
    ct_no_slides = re.sub(
        r'<Override PartName="/ppt/slides/slide\d+\.xml"[^>]*/>',
        "",
        ct,
    )
    slide_overrides = "".join(
        f'<Override PartName="/ppt/slides/slide{n}.xml" '
        f'ContentType="{SLIDE_CONTENT_TYPE}"/>'
        for n in range(1, slide_count + 1)
    )
    ct_new = ct_no_slides.replace("</Types>", slide_overrides + "</Types>")
    if ct_new == ct:
        raise RuntimeError("[Content_Types].xml: could not inject slide overrides")
    ct_path.write_text(ct_new, encoding="utf-8")


def build() -> Path:
    template = TEMPLATE if TEMPLATE.exists() else FALLBACK_TEMPLATE
    if not template.exists():
        raise FileNotFoundError(f"Template not found: {template}")

    work = ROOT / ".pptx-build"
    if work.exists():
        shutil.rmtree(work)
    work.mkdir()

    with zipfile.ZipFile(template, "r") as zf:
        zf.extractall(work)

    slides_dir = work / "ppt/slides"
    n_platform = len(PLATFORM_SLIDES)
    n_intern = 14
    thank_src = 15
    thank_dest = n_intern + n_platform + 1
    total = thank_dest

    # Personalize internship slides 1–14
    for num, texts in INTERNSHIP_TEXTS.items():
        slide_path = slides_dir / f"slide{num}.xml"
        need = count_text_nodes(slide_path)
        apply_texts(slide_path, pad_texts(texts, need) if len(texts) != need else texts)

    # Move thank-you slide to end
    clone_slide_files(work, thank_src, thank_dest)
    (slides_dir / f"slide{thank_src}.xml").unlink(missing_ok=True)
    (slides_dir / "_rels" / f"slide{thank_src}.xml.rels").unlink(missing_ok=True)
    notes = work / "ppt/notesSlides"
    (notes / f"notesSlide{thank_src}.xml").unlink(missing_ok=True)
    (notes / "_rels" / f"notesSlide{thank_src}.xml.rels").unlink(missing_ok=True)

    # Insert platform slides 15 … 15+n_platform-1
    for i, (layout, texts) in enumerate(PLATFORM_SLIDES):
        dest = n_intern + 1 + i
        clone_slide_files(work, layout, dest)
        slide_path = slides_dir / f"slide{dest}.xml"
        need = count_text_nodes(slide_path)
        apply_texts(slide_path, pad_texts(texts, need))

    rebuild_presentation(work, total)

    OUT_PPTX.parent.mkdir(parents=True, exist_ok=True)
    if OUT_PPTX.exists():
        OUT_PPTX.unlink()

    with zipfile.ZipFile(OUT_PPTX, "w", zipfile.ZIP_DEFLATED) as zf:
        for file in sorted(work.rglob("*")):
            if file.is_file():
                zf.write(file, file.relative_to(work).as_posix())

    shutil.rmtree(work)
    return OUT_PPTX


if __name__ == "__main__":
    out = build()
    print(f"Created: {out}")
    print(f"Slides: {len(INTERNSHIP_TEXTS) + len(PLATFORM_SLIDES) + 1} (14 internship + {len(PLATFORM_SLIDES)} platform + thank you)")
