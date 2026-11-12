#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Validate every shipped data file, page and asset before a release.

Runs on plain Python 3 (no third-party packages) and is used by the
`Web CI` workflow, but you can run it locally too:

    python3 scripts/validate_data.py

Exit code 0 means the bundle is consistent; any error exits 1 and prints
every problem found, not just the first one.
"""
from __future__ import annotations

import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
FLUTTER = ROOT / "flutter"

errors: list[str] = []
notes: list[str] = []


def fail(msg: str) -> None:
    errors.append(msg)


def load(rel: str):
    path = ROOT / rel
    if not path.exists():
        fail(f"missing file: {rel}")
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:  # noqa: BLE001 - report, don't crash
        fail(f"invalid JSON in {rel}: {exc}")
        return None


# ---------------------------------------------------------------- constants
EXPECTED_SURAHS = 114
EXPECTED_AYAHS = 6236
EXPECTED_EDITIONS = ["en", "bq", "taisir", "bayan", "mujib", "khan", "hoque"]
MIN_WORDS = 14000
EXPECTED_WORDS = 14660
EXPECTED_BUSINESS = 147


def check_translations(counts: list[int]) -> None:
    tr_dir = ROOT / "assets/data/tr"
    if not tr_dir.is_dir():
        fail("missing assets/data/tr directory")
        return
    files = sorted(tr_dir.glob("*.json"))
    if len(files) != EXPECTED_SURAHS:
        fail(f"assets/data/tr: {len(files)} files, expected {EXPECTED_SURAHS}")
    for n in range(1, EXPECTED_SURAHS + 1):
        path = tr_dir / f"{n}.json"
        if not path.exists():
            fail(f"missing translation file assets/data/tr/{n}.json")
            continue
        data = load(f"assets/data/tr/{n}.json")
        if not isinstance(data, dict):
            continue
        if data.get("s") != n:
            fail(f"tr/{n}.json: s={data.get('s')!r}, expected {n}")
        sources = [s.get("id") for s in data.get("sources", [])]
        if sources != EXPECTED_EDITIONS:
            fail(f"tr/{n}.json: editions {sources} != {EXPECTED_EDITIONS}")
        ayahs = data.get("ayahs") or []
        if len(ayahs) != counts[n - 1]:
            fail(f"tr/{n}.json: {len(ayahs)} ayahs, expected {counts[n - 1]}")
        for i, ayah in enumerate(ayahs, 1):
            if ayah.get("a") != i:
                fail(f"tr/{n}.json: ayah #{i} has a={ayah.get('a')!r}")
                break
            for key in ("ar", "en", "bq"):
                if not str(ayah.get(key, "")).strip():
                    fail(f"tr/{n}.json ayah {i}: empty {key}")
                    break


def check_words() -> None:
    data = load("assets/data/words_index.json")
    if not isinstance(data, list):
        return
    if len(data) < MIN_WORDS:
        fail(f"words_index.json: {len(data)} forms, expected >= {MIN_WORDS}")
    if len(data) != EXPECTED_WORDS:
        notes.append(f"words_index.json: {len(data)} forms (baseline {EXPECTED_WORDS})")
    seen = set()
    for i, row in enumerate(data[:500]):
        for key in ("w", "en", "bn", "ref"):
            if not str(row.get(key, "")).strip():
                fail(f"words_index.json row {i}: empty {key}")
                break
        key = row.get("w")
        if key in seen:
            fail(f"words_index.json: duplicate form {key!r}")
            break
        seen.add(key)
    for name in ("words_index.json", "words_export.json"):
        if not (ROOT / "assets/data" / name).exists():
            fail(f"missing assets/data/{name}")


def check_business() -> None:
    data = load("assets/data/business.json")
    if not isinstance(data, dict):
        return
    sections = data.get("sections") or []
    total = sum(len(s.get("items") or []) for s in sections)
    if total != EXPECTED_BUSINESS:
        fail(f"business.json: {total} entries, expected {EXPECTED_BUSINESS}")
    if len(sections) != 6:
        fail(f"business.json: {len(sections)} sections, expected 6")
    for s in sections:
        for item in s.get("items") or []:
            if not str(item.get("ref", "")).strip() or not str(item.get("en", "")).strip():
                fail(f"business.json section {s.get('id')}: item missing ref/en")
                break


def check_more() -> None:
    names = load("assets/data/more/names.json")
    if isinstance(names, dict):
        rows = names.get("names") or []
        if len(rows) != 99:
            fail(f"more/names.json: {len(rows)} names, expected 99")
        for row in rows:
            if not str(row.get("ar", "")).strip() or not str(row.get("mean", "")).strip():
                fail("more/names.json: name without ar/mean")
                break

    duas = load("assets/data/more/duas.json")
    if isinstance(duas, dict):
        cats = duas.get("categories") or []
        total = sum(len(c.get("items") or []) for c in cats)
        if total != 70:
            fail(f"more/duas.json: {total} du'as, expected 70")
        if len(cats) != 12:
            fail(f"more/duas.json: {len(cats)} categories, expected 12")

    learn = load("assets/data/more/learn.json")
    if isinstance(learn, dict) and len(learn.get("guides") or []) != 10:
        fail(f"more/learn.json: {len(learn.get('guides') or [])} guides, expected 10")

    daily = load("assets/data/more/daily.json")
    if isinstance(daily, dict):
        if len(daily.get("ayahs") or []) < 60:
            fail(f"more/daily.json: {len(daily.get('ayahs') or [])} ayahs, expected >= 60")
        if len(daily.get("hadith") or []) < 50:
            fail(f"more/daily.json: {len(daily.get('hadith') or [])} hadith, expected >= 50")
        for row in daily.get("ayahs") or []:
            if not row.get("ar"):
                fail("more/daily.json: ayah without Arabic")
                break

    topics = load("assets/data/more/topics.json")
    if isinstance(topics, dict) and len(topics.get("topics") or []) != 16:
        fail(f"more/topics.json: {len(topics.get('topics') or [])} topics, expected 16")


def check_flutter_assets() -> None:
    # Flutter keeps the root-level JSON in assets/ and the Knowledge Hub
    # collection under assets/data/more/, so map each web path explicitly.
    pairs = [
        ("assets/data/more/names.json", "assets/data/more/names.json"),
        ("assets/data/more/duas.json", "assets/data/more/duas.json"),
        ("assets/data/more/learn.json", "assets/data/more/learn.json"),
        ("assets/data/more/daily.json", "assets/data/more/daily.json"),
        ("assets/data/more/topics.json", "assets/data/more/topics.json"),
        ("assets/data/business.json", "assets/business.json"),
        ("assets/data/words_export.json", "assets/words_export.json"),
    ]
    for web_rel, mobile_rel in pairs:
        web = ROOT / web_rel
        mobile = FLUTTER / mobile_rel
        if not mobile.exists():
            fail(f"missing Flutter copy: flutter/{mobile_rel}")
            continue
        if web.exists() and web.read_bytes() != mobile.read_bytes():
            fail(f"Flutter copy out of sync: flutter/{mobile_rel}")
    for rel in ("assets/words_index.json.gz", "assets/tafsir.db.gz", "assets/knowledge.json"):
        if not (FLUTTER / rel).exists():
            fail(f"missing Flutter asset: flutter/{rel}")
    pubspec = (FLUTTER / "pubspec.yaml").read_text(encoding="utf-8")
    for need in ("assets/data/more/", "assets/words_index.json.gz", "assets/tafsir.db.gz"):
        if need not in pubspec:
            fail(f"pubspec.yaml does not bundle {need}")


def check_html() -> None:
    pages = [p for p in ROOT.rglob("*.html") if ".git" not in p.parts]
    chapter_pages = list((ROOT / "chapters").glob("[0-9]*.html"))
    if len(chapter_pages) != EXPECTED_SURAHS:
        fail(f"chapters/: {len(chapter_pages)} surah pages, expected {EXPECTED_SURAHS}")
    if len(pages) < 500:
        fail(f"only {len(pages)} HTML pages found, expected the full book")

    for p in pages:
        text = p.read_text(encoding="utf-8")
        rel = p.relative_to(ROOT)
        # Assets/animations are HTML fragments, not documents.
        if rel.parts[0] == "assets" and "animations" in rel.parts:
            continue
        if "Content-Security-Policy" not in text:
            fail(f"{rel}: missing Content-Security-Policy meta tag")
        if 'name="referrer"' not in text:
            fail(f"{rel}: missing referrer policy")
        if "http://" in text:
            for m in re.finditer(r"http://[^\s\"'<>)]+", text):
                url = m.group(0)
                if url.startswith("http://www.w3.org/"):
                    continue  # XML namespaces / SVG identifiers, not requests
                fail(f"{rel}: insecure http:// resource {url[:60]}")
                break
    ignored = {"404.html", "more.html", "search.html", "words.html", "business.html",
               "vocabulary.html", "notes.html", "index.html", "part1.html",
               "part2.html", "part3.html"}
    note = 0
    for name in ignored:
        if not (ROOT / name).exists():
            fail(f"missing top-level page {name}")
            note += 1
    if note == 0:
        reports = (ROOT / "sitemap.xml").exists() and (ROOT / "robots.txt").exists()
        if not reports:
            fail("missing sitemap.xml or robots.txt")


def check_service_worker() -> None:
    sw = (ROOT / "sw.js")
    if not sw.exists():
        fail("missing sw.js")
        return
    text = sw.read_text(encoding="utf-8")
    if "tafsir-v" not in text:
        fail("sw.js has no cache version")
    for match in re.finditer(r'"(\./[^"]+)"', text):
        rel = match.group(1)[2:]
        if rel.endswith("/"):
            continue
        if not (ROOT / rel).exists():
            fail(f"sw.js precaches missing file: {rel}")
    if "safeUrl" not in text:
        fail("sw.js: notification URL is not origin-validated")


def check_workflows() -> None:
    wf = ROOT / ".github/workflows"
    if not wf.is_dir():
        fail("missing .github/workflows")
        return
    uses = []
    for p in wf.glob("*.yml"):
        text = p.read_text(encoding="utf-8")
        uses += re.findall(r"uses:\s*([^\s#]+)", text)
    for use in uses:
        if use.startswith("./"):
            continue
        if "@" not in use:
            fail(f"workflow action without ref: {use}")
            continue
        ref = use.split("@", 1)[1]
        if not re.fullmatch(r"[0-9a-f]{40}", ref):
            fail(f"workflow action not pinned to a full SHA: {use}")


def check_manifest() -> None:
    data = load("manifest.json")
    if not isinstance(data, dict):
        return
    for key in ("id", "name", "short_name", "start_url", "scope", "display", "icons"):
        if key not in data:
            fail(f"manifest.json: missing {key}")
    for icon in data.get("icons", []):
        src = icon.get("src", "")
        if not (ROOT / src).exists():
            fail(f"manifest.json: missing icon {src}")


def check_no_secrets() -> None:
    patterns = [
        (r"AIza[0-9A-Za-z_-]{30,}", "Google API key"),
        (r"ghp_[0-9A-Za-z]{30,}", "GitHub token"),
        (r"-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----", "private key"),
    ]
    roots = ["assets/js", "assets/data", "flutter/lib", "scripts", "server"]
    for root in roots:
        base = ROOT / root
        if not base.exists():
            continue
        for p in base.rglob("*"):
            if not p.is_file() or p.suffix in {".gz", ".db", ".png", ".jpg"}:
                continue
            try:
                text = p.read_text(encoding="utf-8", errors="ignore")
            except OSError:
                continue
            for pattern, label in patterns:
                if re.search(pattern, text):
                    fail(f"{p.relative_to(ROOT)}: possible {label}")


def main() -> int:
    audio = load("assets/data/audio.json")
    counts = []
    if isinstance(audio, dict):
        counts = audio.get("counts") or []
        if len(counts) != EXPECTED_SURAHS:
            fail(f"audio.json: {len(counts)} surah counts, expected {EXPECTED_SURAHS}")
        if sum(counts) != EXPECTED_AYAHS:
            fail(f"audio.json: counts sum to {sum(counts)}, expected {EXPECTED_AYAHS}")
    if len(counts) == EXPECTED_SURAHS:
        check_translations(counts)

    check_words()
    check_business()
    check_more()
    check_flutter_assets()
    check_html()
    check_service_worker()
    check_workflows()
    check_manifest()
    check_no_secrets()

    for note in notes:
        print(f"note: {note}")
    if errors:
        print(f"\n{len(errors)} problem(s):")
        for err in errors:
            print(f"  ✗ {err}")
        return 1
    print("✓ data bundle validated: translations, words, business, knowledge, "
          "Flutter parity, CSP, service worker, actions and manifest")
    return 0


if __name__ == "__main__":
    sys.exit(main())
