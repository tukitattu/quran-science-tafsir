#!/usr/bin/env python3
"""
extract_knowledge.py — offline knowledge-book extractor for the Scientific Tafsir.

Reads source books placed in `knowledge/` (TXT, JSON or PDF), pulls out the
Arabic and the accompanying translation text, links each block to a Quran
ayah / surah / Arabic word / root / category, and writes a single
`assets/data/knowledge.json` bundle.

The web app (`assets/js/knowledge.js`) and the Flutter app read that bundle and
surface every extract as a folded pill button placed after the matching ayah
or after the matching word. The pill unfolds into a rounded popover whose size
follows the amount of available translations.

Usage
-----
    python3 scripts/extract_knowledge.py                 # knowledge/ -> assets/data/knowledge.json
    python3 scripts/extract_knowledge.py --src books/ --out assets/data/knowledge.json
    python3 scripts/extract_knowledge.py --min-ar 12     # ignore tiny arabic snippets

Supported inputs
----------------
*.txt   Paragraphs separated by blank lines. A reference line such as
        `[2:255]`, `(2:255)`, `Al Quran 2:255` or `#ref: 2:255` links the block.
        Optional metadata lines: `#source: <name>`, `#tags: a,b`, `#root: ر-ح-م`.
*.json  Either a list of objects or an object with a `blocks` list. Recognised
        keys per object: ref, ayah, surah, ar/arabic, en, bn, source, tags, root,
        word, title.
*.pdf   Needs `pdftotext` (poppler-utils) when available; otherwise a small
        built-in FlateDecode text scraper is used (works for many simple PDFs).
"""
from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
import zlib
from datetime import datetime, timezone

ARABIC_RE = re.compile(r"[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]")
ARABIC_WORD_RE = re.compile(r"[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]{2,}")
REF_PATTERNS = [
    re.compile(r"#?ref\s*[:=]\s*(\d{1,3})\s*[:.]\s*(\d{1,3})", re.I),
    re.compile(r"\[\s*(?:Al[\s-]?Qur'?an\s*)?(\d{1,3})\s*:\s*([\d\s,\-–]{1,12})\s*\]", re.I),
    re.compile(r"\(\s*(\d{1,3})\s*:\s*(\d{1,3})\s*\)"),
    re.compile(r"\b(\d{1,3})\s*:\s*(\d{1,3})\b"),
]
SURAH_ONLY_RE = re.compile(r"(?:surah|sura|chapter)\s*#?\s*(\d{1,3})\b", re.I)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEFAULT_SRC = os.path.join(BASE_DIR, "knowledge")
DEFAULT_OUT = os.path.join(BASE_DIR, "assets", "data", "knowledge.json")
AR_DIACRITICS = re.compile(r"[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640]")


def norm_ar(s: str) -> str:
    """Normalise an Arabic string for matching (drop harakat, tatweel, BOM)."""
    s = (s or "").replace("\ufeff", "")
    s = AR_DIACRITICS.sub("", s)
    s = s.replace("\u0671", "\u0627")  # alef wasla -> alef
    s = s.replace("\u0622", "\u0627").replace("\u0623", "\u0627").replace("\u0625", "\u0627")
    s = s.replace("\u0649", "\u064a").replace("\u0629", "\u0647")
    return s.strip()


def arabic_len(s: str) -> int:
    return len(ARABIC_RE.findall(s or ""))


def detect_ref(text: str):
    """Return ('ayah', '2:255') or ('surah', '2') or (None, None)."""
    for pat in REF_PATTERNS:
        m = pat.search(text or "")
        if not m:
            continue
        try:
            s = int(m.group(1))
        except ValueError:
            continue
        if not (1 <= s <= 114):
            continue
        try:
            a = int(re.split(r"[\s,\-–]", m.group(2).strip())[0])
        except (ValueError, IndexError):
            a = None
        if a:
            return "ayah", f"{s}:{a}"
        return "surah", str(s)
    m = SURAH_ONLY_RE.search(text or "")
    if m and 1 <= int(m.group(1)) <= 114:
        return "surah", m.group(1)
    return None, None


def translate_to_dicts(s: str):
    """Split a text into a rough {kind: text} for en/bn/ar runs."""
    return s.strip()


# --------------------------------------------------------------------------- #
# readers
# --------------------------------------------------------------------------- #
def read_txt(path: str):
    with open(path, "r", encoding="utf-8", errors="replace") as fh:
        raw = fh.read()
    blocks = re.split(r"\n\s*\n", raw)
    for b in blocks:
        b = b.strip()
        if b:
            yield {"__text__": b}


def read_json(path: str):
    with open(path, "r", encoding="utf-8", errors="replace") as fh:
        data = json.load(fh)
    items = data.get("blocks") if isinstance(data, dict) else data
    if isinstance(data, dict) and items is None:
        # {"2:255": {...}} style maps
        items = []
        for k, v in data.items():
            if isinstance(v, dict):
                v.setdefault("ref", k)
                items.append(v)
            elif isinstance(v, str):
                items.append({"ref": k, "ar": v})
    if not isinstance(items, list):
        return
    for it in items:
        if isinstance(it, str):
            yield {"__text__": it}
        elif isinstance(it, dict):
            yield it


def _pdf_text_fallback(path: str) -> str:
    """Very small PDF text scraper: inflate streams and pull (...)Tj / [...]TJ."""
    with open(path, "rb") as fh:
        data = fh.read()
    chunks = []
    for m in re.finditer(rb"stream\r?\n(.*?)\r?\nendstream", data, re.S):
        raw = m.group(1)
        try:
            raw = zlib.decompress(raw)
        except zlib.error:
            continue
        text = raw.decode("latin-1", "replace")
        for tm in re.finditer(r"\((?:[^()\\]|\\.)*\)\s*Tj", text):
            chunks.append(tm.group(0))
        for tm in re.finditer(r"\[(.*?)\]\s*TJ", text, re.S):
            parts = re.findall(r"\((?:[^()\\]|\\.)*\)", tm.group(1))
            if parts:
                chunks.append("".join(parts))
    out = []
    for c in chunks:
        c = re.sub(r"^\(|\)\s*T[jJ]$", "", c)
        c = c.replace("\\(", "(").replace("\\)", ")").replace("\\\\", "\\")
        out.append(c)
    return "\n".join(out)


def read_pdf(path: str):
    text = None
    if _which("pdftotext"):
        try:
            res = subprocess.run(["pdftotext", "-enc", "UTF-8", "-nopgbrk", path, "-"],
                                 capture_output=True, text=True, timeout=180)
            if res.returncode == 0 and res.stdout.strip():
                text = res.stdout
        except Exception:
            text = None
    if text is None:
        try:
            text = _pdf_text_fallback(path)
        except Exception as exc:  # pragma: no cover
            sys.stderr.write(f"  ! could not read PDF {path}: {exc}\n")
            return
    for b in re.split(r"\n\s*\n", text or ""):
        b = b.strip()
        if b:
            yield {"__text__": b}


def _which(exe: str) -> bool:
    return any(os.access(os.path.join(p, exe), os.X_OK)
               for p in os.environ.get("PATH", "").split(os.pathsep) if p)


READERS = {".txt": read_txt, ".md": read_txt, ".json": read_json, ".pdf": read_pdf}


# --------------------------------------------------------------------------- #
# normalise a source block into a knowledge record
# --------------------------------------------------------------------------- #
def coerce_record(item: dict, source: str, title: str, seq: int, min_ar: int):
    text = item.pop("__text__", "") if isinstance(item, dict) else str(item)
    meta = {k: v for k, v in item.items()} if isinstance(item, dict) else {}

    en = meta.get("en") or meta.get("english")
    bn = meta.get("bn") or meta.get("bengali") or meta.get("bangla")
    ar = meta.get("ar") or meta.get("arabic")
    body = text or meta.get("text") or meta.get("body") or ""

    if ar is None:
        ar_lines = [ln for ln in re.split(r"[\n]+", body) if arabic_len(ln) >= min_ar]
        ar = "\n".join(ar_lines).strip() or None
    if en is None and body:
        en_lines = [ln for ln in re.split(r"\n+", body)
                    if arabic_len(ln) < min_ar and len(ln.strip()) > 3]
        en = "\n".join(en_lines).strip() or None

    if not (ar or en or bn):
        return None

    ref = meta.get("ref") or meta.get("ayah") or meta.get("ayah_key")
    kind, key = (None, None)
    if ref:
        kind, key = detect_ref(str(ref))
    if kind is None:
        kind, key = detect_ref(body) or detect_ref(json.dumps(meta, ensure_ascii=False))

    if meta.get("surah") and kind is None:
        kind, key = "surah", str(int(meta["surah"]))
    if meta.get("word"):
        kind, key = "word", str(meta["word"])
    elif meta.get("root"):
        kind, key = "root", str(meta["root"])

    tags = meta.get("tags") or meta.get("category") or []
    if isinstance(tags, str):
        tags = [x.strip() for x in re.split(r"[,;]", tags) if x.strip()]

    return {
        "id": f"{os.path.basename(source)}#{seq}",
        "src": meta.get("source") or title,
        "title": meta.get("title") or None,
        "lang": meta.get("lang"),
        "ar": (ar or "").strip() or None,
        "en": (en or "").strip() or None,
        "bn": (bn or "").strip() or None,
        "word": meta.get("word"),
        "root": meta.get("root"),
        "tags": tags,
        "kind": kind,
        "key": key,
        "file": os.path.basename(source),
    }


def load_sources(src_dir: str, min_ar: int):
    records = []
    sources = []
    if not os.path.isdir(src_dir):
        sys.stderr.write(f"! source dir not found: {src_dir}\n")
        return records, sources
    for root, _dirs, files in os.walk(src_dir):
        for name in sorted(files):
            ext = os.path.splitext(name)[1].lower()
            reader = READERS.get(ext)
            if not reader:
                continue
            path = os.path.join(root, name)
            title = os.path.splitext(name)[0].replace("_", " ").replace("-", " ").strip()
            count = 0
            for seq, item in enumerate(reader(path)):
                rec = coerce_record(item, path, title, seq, min_ar)
                if rec:
                    records.append(rec)
                    count += 1
            sources.append({"file": os.path.relpath(path, src_dir), "title": title,
                            "ext": ext, "blocks": count})
            print(f"  · {os.path.relpath(path, src_dir)} — {count} blocks")
    return records, sources


def source_fingerprint(src_dir):
    """Stable hash of the source files — changes only when content changes."""
    import hashlib
    h = hashlib.sha256()
    for path in sorted(
        os.path.join(root, f)
        for root, _dirs, files in os.walk(src_dir)
        for f in files
    ):
        h.update(os.path.relpath(path, src_dir).encode("utf-8"))
        try:
            with open(path, "rb") as fh:
                h.update(fh.read())
        except OSError:
            pass
    return "sources:" + h.hexdigest()[:16]


def build_bundle(records, sources, generated=None):
    by_ayah, by_surah, by_word, by_root, by_tag = {}, {}, {}, {}, {}
    for r in records:
        if r["kind"] == "ayah" and r["key"]:
            by_ayah.setdefault(r["key"], []).append(r)
        elif r["kind"] == "surah" and r["key"]:
            by_surah.setdefault(r["key"], []).append(r)
        if r["kind"] == "word" and r["key"]:
            by_word.setdefault(norm_ar(r["key"]), []).append(r)
        if r["kind"] == "root" and r["key"]:
            by_root.setdefault(r["key"], []).append(r)
        if r["ar"]:
            for w in set(ARABIC_WORD_RE.findall(r["ar"])):
                by_word.setdefault(norm_ar(w), []).append(r)
        if r["root"]:
            by_root.setdefault(r["root"], []).append(r)
        for tg in (r["tags"] or []):
            by_tag.setdefault(str(tg).lower(), []).append(r)
    # de-duplicate identical records per bucket
    for bucket in (by_ayah, by_surah, by_word, by_root, by_tag):
        for k, lst in bucket.items():
            seen, uniq = set(), []
            for r in lst:
                if r["id"] in seen:
                    continue
                seen.add(r["id"])
                uniq.append(r)
            bucket[k] = uniq
    return {
        "generated": generated or "sources:unknown",
        "counts": {
            "records": len(records), "ayahs": len(by_ayah), "surahs": len(by_surah),
            "words": len(by_word), "roots": len(by_root), "tags": len(by_tag),
        },
        "sources": sources,
        "byAyah": by_ayah,
        "bySurah": by_surah,
        "byWord": by_word,
        "byRoot": by_root,
        "byTag": by_tag,
    }


def main():
    ap = argparse.ArgumentParser(description="Extract knowledge books into assets/data/knowledge.json")
    ap.add_argument("--src", default=DEFAULT_SRC, help="folder with .txt/.json/.pdf sources")
    ap.add_argument("--out", default=DEFAULT_OUT)
    ap.add_argument("--min-ar", type=int, default=8, help="minimum arabic chars to treat a line as arabic")
    args = ap.parse_args()

    print(f"Reading sources from {args.src}")
    records, sources = load_sources(args.src, args.min_ar)
    bundle = build_bundle(records, sources, source_fingerprint(args.src))
    os.makedirs(os.path.dirname(args.out), exist_ok=True)
    with open(args.out, "w", encoding="utf-8") as fh:
        json.dump(bundle, fh, ensure_ascii=False, separators=(",", ":"))
    c = bundle["counts"]
    print(f"Wrote {args.out}")
    print(f"  records={c['records']} ayahs={c['ayahs']} surahs={c['surahs']} "
          f"words={c['words']} roots={c['roots']} tags={c['tags']}")


if __name__ == "__main__":
    main()
