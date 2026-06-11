"""
Split combined Handout files into separate Phrase Reorganization files.

Input:  static/content/handouts/Handout/{unit}/{unit}-Handout.{md,pdf}
Output: static/content/handouts/phrase-reorganization/{unit}/{unit}-Phrase.{md,pdf}
"""

import argparse
import re
from pathlib import Path

try:
    from PyPDF2 import PdfReader, PdfWriter
except ImportError:
    PdfReader = None
    PdfWriter = None

HANDOUT_ROOT = Path("static/content/handouts/Handout")
PHRASE_ROOT = Path("static/content/handouts/phrase-reorganization")
PAGE_BREAK_MARKER = '<div class="page-break"></div>'
PHRASE_STYLE = """<style>
.question-block { page-break-inside: avoid; break-inside: avoid-page; display: block; width: 100%; margin-bottom: 20px; }
.phrase-text { margin-bottom: 12px; font-weight: bold; }
.chinese-text { margin-bottom: 12px; }
.scrambled-text { margin-bottom: 0px; }
.separator { margin-top: 75px; margin-bottom: 20px; border: 0; border-top: 1px solid #ccc; }
</style>

"""


def split_markdown(handout_md: Path, phrase_md: Path) -> bool:
    text = handout_md.read_text(encoding="utf-8")
    marker_idx = text.find(PAGE_BREAK_MARKER)
    if marker_idx < 0:
        print(f"  [skip md] No page-break marker in {handout_md}")
        return False

    phrase_content = text[marker_idx + len(PAGE_BREAK_MARKER) :].lstrip("\n")
    phrase_md.parent.mkdir(parents=True, exist_ok=True)
    phrase_md.write_text(PHRASE_STYLE + phrase_content, encoding="utf-8")
    print(f"  [ok md]   {phrase_md}")
    return True


def find_phrase_start_page(pdf_path: Path) -> int | None:
    if PdfReader is None:
        return None

    reader = PdfReader(str(pdf_path))
    for i, page in enumerate(reader.pages):
        page_text = page.extract_text() or ""
        if "Chinese-to-English" in page_text:
            return i
    return None


def split_pdf(handout_pdf: Path, phrase_pdf: Path) -> bool:
    if PdfReader is None or PdfWriter is None:
        print("  [skip pdf] PyPDF2 not installed")
        return False
    if not handout_pdf.exists():
        print(f"  [skip pdf] Missing {handout_pdf}")
        return False

    start_page = find_phrase_start_page(handout_pdf)
    if start_page is None:
        print(f"  [skip pdf] Could not find phrase section in {handout_pdf}")
        return False

    reader = PdfReader(str(handout_pdf))
    writer = PdfWriter()
    for page in reader.pages[start_page:]:
        writer.add_page(page)

    phrase_pdf.parent.mkdir(parents=True, exist_ok=True)
    with phrase_pdf.open("wb") as f:
        writer.write(f)
    print(f"  [ok pdf]  {phrase_pdf} (from page {start_page + 1})")
    return True


def process_unit(unit_dir: Path) -> None:
    unit_name = unit_dir.name
    handout_md = unit_dir / f"{unit_name}-Handout.md"
    handout_pdf = unit_dir / f"{unit_name}-Handout.pdf"
    phrase_dir = PHRASE_ROOT / unit_name
    phrase_md = phrase_dir / f"{unit_name}-Phrase.md"
    phrase_pdf = phrase_dir / f"{unit_name}-Phrase.pdf"

    print(f"\n{unit_name}:")
    if handout_md.exists():
        split_markdown(handout_md, phrase_md)
    else:
        print(f"  [skip] Missing {handout_md}")

    if handout_pdf.exists():
        split_pdf(handout_pdf, phrase_pdf)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Split combined Handout files into phrase-reorganization files."
    )
    parser.add_argument(
        "unit",
        nargs="?",
        help="Unit name (e.g. YLE-1). Omit to process all units under Handout/.",
    )
    args = parser.parse_args()

    if args.unit:
        unit_dir = HANDOUT_ROOT / args.unit
        if not unit_dir.is_dir():
            raise SystemExit(f"Unit directory not found: {unit_dir}")
        process_unit(unit_dir)
        return

    if not HANDOUT_ROOT.is_dir():
        raise SystemExit(f"Handout directory not found: {HANDOUT_ROOT}")

    for unit_dir in sorted(HANDOUT_ROOT.iterdir()):
        if unit_dir.is_dir():
            process_unit(unit_dir)


if __name__ == "__main__":
    main()
