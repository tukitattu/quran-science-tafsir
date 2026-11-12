#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Generate sitemap.xml + robots.txt for the GitHub Pages site.

Deterministic: URLs come from the committed chapter pages, not from a crawl.
Run from the repo root:  python3 scripts/build_sitemap.py
"""
import pathlib
import subprocess
import sys
import xml.etree.ElementTree as ET

ROOT = pathlib.Path(__file__).resolve().parents[1]
BASE = "https://tukitattu.github.io/quran-science-tafsir/"


def lastmod() -> str:
    try:
        return subprocess.check_output(
            ["git", "log", "-1", "--format=%cs"], cwd=ROOT, text=True
        ).strip()
    except Exception:
        return "2026-01-01"


def main() -> int:
    urls = [""]
    for name in ["index.html", "part1.html", "part2.html", "part3.html",
                 "vocabulary.html", "words.html", "business.html", "more.html",
                 "search.html", "notes.html"]:
        if (ROOT / name).exists():
            urls.append(name)
    chapters = sorted(
        (ROOT / "chapters").glob("*.html"),
        key=lambda p: int(p.stem) if p.stem.isdigit() else 999,
    )
    for p in chapters:
        if p.stem.isdigit():
            urls.append(f"chapters/{p.name}")
    read_pages = sorted(ROOT.glob("chapters/*/read/*.html"))
    for p in read_pages:
        urls.append(str(p.relative_to(ROOT)).replace("\\", "/"))

    mod = lastmod()
    root = ET.Element("urlset", xmlns="http://www.sitemaps.org/schemas/sitemap/0.9")
    for u in urls:
        node = ET.SubElement(root, "url")
        loc = ET.SubElement(node, "loc")
        loc.text = BASE + u
        ET.SubElement(node, "lastmod").text = mod
        ET.SubElement(node, "changefreq").text = "weekly"
        prio = ET.SubElement(node, "priority")
        prio.text = "1.0" if u in ("", "index.html") else ("0.8" if u.startswith("chapters/") else "0.6")
    ET.indent(root, space="  ")
    (ROOT / "sitemap.xml").write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n' + ET.tostring(root, encoding="unicode"),
        encoding="utf-8",
    )
    (ROOT / "robots.txt").write_text(
        "User-agent: *\n"
        "Allow: /\n"
        "Disallow: /assets/data/\n"
        "Disallow: /assets/animations/\n"
        "Disallow: /server/\n"
        "Sitemap: " + BASE + "sitemap.xml\n",
        encoding="utf-8",
    )
    print(f"sitemap.xml: {len(urls)} URLs (lastmod {mod})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
