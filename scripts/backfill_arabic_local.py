#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Fill `verses.ar` from the bundled Uthmani text (assets/data/quran_ar.json).

Offline and deterministic: no API calls. Each verses row is a paragraph that
may cover several ayahs via its `[n]` markers; the Arabic for those ayahs is
joined with the ۞ separator. Also rebuilds flutter/assets/tafsir.db.gz.

Safe to run repeatedly (idempotent).
"""
import gzip
import json
import pathlib
import re
import sqlite3
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
DB_PATH = ROOT / "tafsir.db"
QURAN_AR = ROOT / "assets/data/quran_ar.json"
APP_DB_GZ = ROOT / "flutter/assets/tafsir.db.gz"
SEP = " ۞ "


def clean(text):
    return (text or "").replace("\ufeff", "").strip()


def main():
    quran = json.loads(QURAN_AR.read_text(encoding="utf-8-sig"))
    conn = sqlite3.connect(DB_PATH)
    rows = conn.execute(
        "SELECT id, surah_id, en, COALESCE(ar, '') FROM verses"
    ).fetchall()
    changed = 0
    missing = 0
    for verse_id, surah_id, en, ar in rows:
        nums = [int(n) for n in re.findall(r"\[(\d+)\]", en or "")]
        if not nums:
            continue
        surah = quran.get(str(surah_id)) or {}
        parts = [clean(surah.get(str(n), "")) for n in nums]
        parts = [p for p in parts if p]
        if not parts:
            missing += 1
            continue
        text = SEP.join(parts)
        if text != ar:
            conn.execute("UPDATE verses SET ar = ? WHERE id = ?", (text, verse_id))
            changed += 1
    if changed:
        conn.commit()
        conn.execute("VACUUM")
        conn.close()
        data = DB_PATH.read_bytes()
        APP_DB_GZ.parent.mkdir(parents=True, exist_ok=True)
        APP_DB_GZ.write_bytes(gzip.compress(data, 9, mtime=0))
        print(
            f"backfill_arabic_local: {changed}/{len(rows)} rows updated, "
            f"{missing} without Arabic, gz={APP_DB_GZ.stat().st_size} bytes"
        )
    else:
        conn.close()
        print(f"backfill_arabic_local: up to date ({len(rows)} rows), no rewrite")
    if missing:
        print("warning: some paragraphs had no matching ayah text", file=sys.stderr)


if __name__ == "__main__":
    main()
