#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Normalize <script> tags on paginated chapter read pages.

The page generator embedded a copy of the chapter shell (including its script
tags) inside each read page, so every page loaded chapters.js and app.js twice.
The second copy re-declared `const QURAN` / `const I18N` and threw, which broke
TTs and any listener registered after app.js.

This removes every occurrence and appends exactly one canonical set before
</body>. Idempotent: running it on a healthy page changes nothing.

    python3 scripts/normalize_read_pages.py
"""
from __future__ import annotations

import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]

SCRIPTS = [
    "../../../assets/data/chapters.js",
    "../../../assets/js/app.js",
    "../../../assets/js/tts.js",
]


def main() -> int:
    pages = sorted(ROOT.glob("chapters/*/read/*.html"))
    fixed = 0
    for page in pages:
        text = page.read_text(encoding="utf-8")
        original = text
        for src in SCRIPTS:
            text = re.sub(
                r"[ \t]*<script src=\"" + re.escape(src) + r"\"></script>[ \t]*\n?",
                "",
                text,
            )
        block = "\n" + "".join(
            f'  <script src="{src}"></script>\n' for src in SCRIPTS
        )
        # Drop whitespace-only runs left immediately before </body> so repeated
        # runs do not accumulate blank lines.
        text = re.sub(r"(?:[ \t]*\n)+</body>", "</body>", text)
        if "</body>" in text:
            text = text.replace("</body>", block + "</body>", 1)
        else:
            text = text.rstrip() + "\n" + block
        if text != original:
            page.write_text(text, encoding="utf-8")
            fixed += 1
    print(f"read pages normalized: {fixed}/{len(pages)} changed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
