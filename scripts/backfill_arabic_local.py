#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Fill `verses.ar` from the bundled Uthmani text (assets/data/quran_ar.json),
build the complete `quran_ayahs` table (all 6,236 ayahs) and refresh the
`alt_meanings` table from `assets/data/alt_meanings.json`.

Offline and deterministic: no API calls. Each `verses` row is a paragraph that
may cover several ayahs via its `[n]` markers; the Arabic for those ayahs is
joined with the ۞ separator. The `quran_ayahs` table is the authoritative
Arabic source for the ayah-of-the-day and Arabic search.

Also rebuilds flutter/assets/tafsir.db.gz.

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
ALT_JSON = ROOT / "assets/data/alt_meanings.json"
DEEP_JS = ROOT / "assets/data/deep_research.js"
APP_DB_GZ = ROOT / "flutter/assets/tafsir.db.gz"
SEP = " ۞ "


def clean(text):
    return (text or "").replace("\ufeff", "").strip()


def main():
    quran = json.loads(QURAN_AR.read_text(encoding="utf-8-sig"))
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    # 1) Paragraph-level Arabic, where the English text carries [n] markers.
    rows = cur.execute(
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
            cur.execute("UPDATE verses SET ar = ? WHERE id = ?", (text, verse_id))
            changed += 1

    # 2) Complete ayah table (6,236 rows) + FTS index.
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS quran_ayahs (
            surah_id INTEGER,
            ayah_num INTEGER,
            ar TEXT,
            PRIMARY KEY (surah_id, ayah_num)
        )
        """
    )
    cur.execute(
        """
        CREATE VIRTUAL TABLE IF NOT EXISTS quran_ayahs_fts
        USING fts5(ar, content='quran_ayahs', content_rowid='rowid')
        """
    )
    ayahs = []
    for sn, surah in quran.items():
        for an, txt in surah.items():
            text = clean(txt)
            if text:
                ayahs.append((int(sn), int(an), text))
    cur.execute("DELETE FROM quran_ayahs")
    cur.executemany(
        "INSERT OR REPLACE INTO quran_ayahs (surah_id, ayah_num, ar) VALUES (?,?,?)",
        ayahs,
    )
    cur.execute("INSERT INTO quran_ayahs_fts(quran_ayahs_fts) VALUES('rebuild')")

    # 3) Alternative meanings table from the bundled JSON.
    if ALT_JSON.exists():
        alts = json.loads(ALT_JSON.read_text(encoding="utf-8"))
        cur.execute("DELETE FROM alt_meanings")
        cur.executemany(
            "INSERT OR REPLACE INTO alt_meanings (ayah_key, data) VALUES (?,?)",
            [(k, json.dumps(v, ensure_ascii=False)) for k, v in alts.items()],
        )

    # 4) Surah-level amud/nazm lines, refreshed from deep_research.js so the DB
    #    never keeps an English placeholder in an `ar`/`bn` column.
    if DEEP_JS.exists():
        src = DEEP_JS.read_text(encoding="utf-8")
        deep = json.loads(src[src.index("{"):src.rindex("}") + 1])
        for num, entry in deep.items():
            amud = entry.get("amud") or {}
            nazm = entry.get("nazm") or {}
            cur.execute(
                """
                UPDATE tafsir SET amud_en=?, amud_bn=?, amud_ar=?,
                                  nazm_en=?, nazm_bn=?, nazm_ar=?
                WHERE surah_id=?
                """,
                (
                    amud.get("en"), amud.get("bn"), amud.get("ar"),
                    nazm.get("en"), nazm.get("bn"), nazm.get("ar"),
                    int(num),
                ),
            )

    conn.commit()
    cur.execute("VACUUM")
    conn.close()

    data = DB_PATH.read_bytes()
    packed = gzip.compress(data, 9, mtime=0)
    # Keep the web download (repo root) and the Flutter asset byte-identical.
    (ROOT / "tafsir.db.gz").write_bytes(packed)
    APP_DB_GZ.parent.mkdir(parents=True, exist_ok=True)
    APP_DB_GZ.write_bytes(packed)
    print(
        f"backfill_arabic_local: {changed}/{len(rows)} paragraphs updated, "
        f"{missing} without markers, {len(ayahs)} ayahs, "
        f"gz={APP_DB_GZ.stat().st_size} bytes"
    )
    if missing:
        print("warning: some paragraphs had no matching ayah text", file=sys.stderr)


if __name__ == "__main__":
    main()
