#!/usr/bin/env python3
"""
Add a single page border per slide and set fonts to Times New Roman.
Does NOT add borders around individual text boxes.
"""

from __future__ import annotations

import re
import shutil
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "public/downloads/Click-Compress-Project-Slides.pptx"
DESKTOP_OUT = Path.home() / "Desktop" / "Click-Compress-Project-Slides.pptx"
REPO_OUT = SOURCE

FONT = "Times New Roman"

# 16:9 slide size from template (EMU)
SLIDE_CX = 9_144_000
SLIDE_CY = 5_143_500
PAGE_MARGIN = 45_720  # ~0.05 inch inset

BORDER_LN = (
    '<a:ln w="19050" cap="flat" cmpd="sng" algn="ctr">'
    '<a:solidFill><a:srgbClr val="000000"/></a:solidFill>'
    '<a:prstDash val="solid"/>'
    "</a:ln>"
)

TYPEFACE_RE = re.compile(
    r'(<a:(?:latin|ea|cs|sym|buFont)\s[^>]*typeface=")([^"]*)(")',
)

PAGE_BORDER_MARKER = "PageBorderFrame"


def apply_fonts(xml: str) -> str:
    def repl(m: re.Match[str]) -> str:
        return f"{m.group(1)}{FONT}{m.group(3)}"

    xml = TYPEFACE_RE.sub(repl, xml)
    xml = re.sub(r'typeface="[^"]*"', f'typeface="{FONT}"', xml)
    return xml


def apply_theme_fonts(xml: str) -> str:
    xml = re.sub(
        r'(<a:majorFont>.*?<a:latin\s+typeface=")[^"]*(")',
        rf"\1{FONT}\2",
        xml,
        flags=re.DOTALL,
    )
    xml = re.sub(
        r'(<a:minorFont>.*?<a:latin\s+typeface=")[^"]*(")',
        rf"\1{FONT}\2",
        xml,
        flags=re.DOTALL,
    )
    return apply_fonts(xml)


def next_shape_id(xml: str) -> int:
    ids = [int(x) for x in re.findall(r'<p:cNvPr id="(\d+)"', xml)]
    return max(ids, default=1) + 1


def remove_existing_page_border(xml: str) -> str:
    return re.sub(
        r"<p:sp>\s*<p:nvSpPr>\s*<p:cNvPr id=\"\d+\" name=\""
        + PAGE_BORDER_MARKER
        + r"\".*?</p:sp>\s*",
        "",
        xml,
        flags=re.DOTALL,
    )


def add_page_border(xml: str) -> str:
    xml = remove_existing_page_border(xml)
    if PAGE_BORDER_MARKER in xml:
        return xml

    shape_id = next_shape_id(xml)
    x = PAGE_MARGIN
    y = PAGE_MARGIN
    w = SLIDE_CX - 2 * PAGE_MARGIN
    h = SLIDE_CY - 2 * PAGE_MARGIN

    frame = (
        "<p:sp>"
        "<p:nvSpPr>"
        f'<p:cNvPr id="{shape_id}" name="{PAGE_BORDER_MARKER}"/>'
        "<p:cNvSpPr/><p:nvPr/>"
        "</p:nvSpPr>"
        "<p:spPr>"
        f'<a:xfrm><a:off x="{x}" y="{y}"/><a:ext cx="{w}" cy="{h}"/></a:xfrm>'
        '<a:prstGeom prst="rect"><a:avLst/></a:prstGeom>'
        "<a:noFill/>"
        f"{BORDER_LN}"
        "</p:spPr>"
        "</p:sp>"
    )

    # Insert behind slide content (right after group shape properties).
    marker = "</p:grpSpPr>"
    pos = xml.find(marker)
    if pos == -1:
        raise ValueError("Could not find spTree grpSpPr to insert page border")
    insert_at = pos + len(marker)
    return xml[:insert_at] + frame + xml[insert_at:]


def process_slide(path: Path) -> None:
    text = path.read_text(encoding="utf-8")
    text = apply_fonts(text)
    text = add_page_border(text)
    path.write_text(text, encoding="utf-8")


def process_other_xml(path: Path) -> None:
    text = path.read_text(encoding="utf-8")
    if "theme" in path.parts:
        text = apply_theme_fonts(text)
    else:
        text = apply_fonts(text)
    path.write_text(text, encoding="utf-8")


def style_pptx(src: Path, dest: Path) -> Path:
    if not src.exists():
        raise FileNotFoundError(src)

    work = ROOT / ".pptx-style-build"
    if work.exists():
        shutil.rmtree(work)
    work.mkdir()

    with zipfile.ZipFile(src, "r") as zf:
        zf.extractall(work)

    for path in sorted(work.glob("ppt/slides/slide*.xml")):
        process_slide(path)

    for pattern in [
        "ppt/slideLayouts/slideLayout*.xml",
        "ppt/slideMasters/slideMaster*.xml",
        "ppt/notesSlides/notesSlide*.xml",
        "ppt/theme/theme*.xml",
    ]:
        for path in work.glob(pattern):
            process_other_xml(path)

    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists():
        dest.unlink()

    with zipfile.ZipFile(dest, "w", zipfile.ZIP_DEFLATED) as zf:
        for file in sorted(work.rglob("*")):
            if file.is_file():
                zf.write(file, file.relative_to(work).as_posix())

    shutil.rmtree(work)
    return dest


if __name__ == "__main__":
    style_pptx(SOURCE, REPO_OUT)
    shutil.copy2(REPO_OUT, DESKTOP_OUT)
    print(f"Page borders + Times New Roman applied:\n  {REPO_OUT}\n  {DESKTOP_OUT}")
