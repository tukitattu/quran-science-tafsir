#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Apply baseline browser security metadata to every static HTML page.

GitHub Pages cannot emit real HTTP security headers, so the equivalent
`<meta http-equiv>` / `<meta name>` directives are injected into the document
head. This is idempotent: pages that already carry the block are skipped.

Run after generating or editing any HTML page:
    python3 scripts/apply_security_headers.py
"""
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]

CSP = (
    "default-src 'self'; "
    "script-src 'self' 'unsafe-inline'; "
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
    "font-src 'self' data: https://fonts.gstatic.com; "
    "img-src 'self' data: blob: https:; "
    "media-src 'self' data: blob: https:; "
    "connect-src 'self' https:; "
    "frame-src https://www.youtube-nocookie.com https://www.youtube.com; "
    "worker-src 'self'; manifest-src 'self'; "
    "object-src 'none'; base-uri 'self'; form-action 'none'; "
    "upgrade-insecure-requests"
)

BLOCK = (
    '  <meta http-equiv="Content-Security-Policy" content="{csp}">\n'
    '  <meta name="referrer" content="strict-origin-when-cross-origin">\n'
    '  <meta name="permissions-policy" content="camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=(), display-capture=()">\n'
    '  <meta name="color-scheme" content="light dark">\n'
    '  <meta name="format-detection" content="telephone=no">\n'
).format(csp=CSP)

ANCHOR = '  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n'


def main() -> int:
    pages = sorted(ROOT.rglob("*.html"))
    changed = 0
    for p in pages:
        if ".git" in p.parts:
            continue
        text = p.read_text(encoding="utf-8")
        if "Content-Security-Policy" in text:
            continue
        if ANCHOR not in text:
            print(f"!! no viewport anchor in {p}")
            continue
        text = text.replace(ANCHOR, ANCHOR + BLOCK, 1)
        p.write_text(text, encoding="utf-8")
        changed += 1
    print(f"security headers: {changed} pages updated ({len(pages)} scanned)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
