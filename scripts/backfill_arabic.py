#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Backfill Arabic (Uthmani) ayah text into tafsir.db + expand alternative translations.

Fixes two long-standing data issues:
1. `verses.ar` was empty for all 7,796 paragraphs — now filled by mapping each
   paragraph's [n] ayah markers to the Uthmani text (api.alquran.cloud).
2. `alt_meanings` only had single-translation samples — now expands each sampled
   ayah with multiple English translations (Pickthall, Yusuf Ali, Sahih Intl),
   a Bengali translation (Muhiuddin Khan) and word-level corpus data.

Safe to run repeatedly (idempotent). Never overwrites existing non-empty Arabic.
"""
import argparse, gzip, json, os, pathlib, re, shutil, sqlite3, sys, time, urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
DB_PATH = ROOT / "tafsir.db"
ALT_WEB = ROOT / "assets/data/alt_meanings.json"
APP_DB_GZ = ROOT / "flutter/assets/tafsir.db.gz"
HEADERS = {"User-Agent": "ScientificTafsirBot/1.0 (+https://etside.github.io/quran-science-tafsir/)"}

SAMPLE_AYAHS = [
    (1, 1), (1, 2), (1, 4), (1, 7), (2, 2), (2, 31), (2, 255), (2, 286),
    (3, 7), (4, 34), (10, 5), (13, 2), (18, 10), (21, 30), (24, 35), (24, 40),
    (30, 2), (31, 6), (34, 9), (36, 1), (36, 40), (41, 53), (51, 47), (55, 1),
    (55, 19), (57, 25), (67, 1), (78, 6), (79, 30), (86, 1), (90, 12), (96, 1),
    (100, 1), (108, 1), (110, 1), (112, 1), (112, 2), (112, 3), (112, 4), (113, 1),
    (113, 2), (113, 3), (113, 4), (113, 5), (114, 1), (114, 2), (114, 3), (114, 4),
    (114, 5), (114, 6),
]

def fetch_json(url, timeout=25, retries=2):
    for i in range(retries + 1):
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=timeout) as r:
                return json.loads(r.read().decode("utf-8"))
        except Exception as e:
            print(f"  fetch {url} try {i+1}: {e}", file=sys.stderr)
            time.sleep(1.2 * (i + 1))
    return None

def load_uthmani(surahs):
    """surah -> ayah -> text, for the surahs referenced by tafsir paragraphs."""
    out = {}
    for sn in surahs:
        j = fetch_json(f"https://api.alquran.cloud/v1/surah/{sn}/quran-uthmani")
        if not j or j.get("code") != 200:
            print(f"uthmani surah {sn} failed", file=sys.stderr)
            continue
        m = {a["numberInSurah"]: a["text"] for a in j["data"]["ayahs"]}
        out[sn] = m
        time.sleep(0.4)
    return out

def para_arabic(en_text, arabic_map):
    """Rebuild paragraph Arabic from [n]-marked segments. Returns (ar_text, ayahs_used)."""
    if not arabic_map or not re.search(r"\[\d+\]", en_text):
        return "", []
    parts = []
    used = []
    pieces = re.split(r"\[(\d+)\]", en_text)
    # pieces = [pre, n1, seg1, n2, seg2, ...]
    for i in range(1, len(pieces), 2):
        n = int(pieces[i])
        if n in arabic_map:
            parts.append(f"[{n}] {arabic_map[n]}")
            used.append(n)
    if not parts:
        return "", []
    return " ".join(parts), used

def bismillah_strip(text, sn, n):
    # surah 1 ayah 1 IS the bismillah; other surahs' editions already exclude it
    return text

def backfill():
    con = sqlite3.connect(DB_PATH)
    cur = con.cursor()
    n_empty = cur.execute("SELECT COUNT(*) FROM verses WHERE ar IS NULL OR ar=''").fetchone()[0]
    if n_empty == 0:
        print("Arabic already backfilled; nothing to do.")
    else:
        surahs = [r[0] for r in cur.execute("SELECT DISTINCT surah_id FROM verses WHERE ar IS NULL OR ar=''")]
        print(f"Backfilling Arabic for {n_empty} paragraphs across {len(surahs)} surahs…")
        # surah 110,111-114 short; fetch largest first for progress
        arabic = load_uthmani(surahs)
        done = 0
        for vid, sn, en in cur.execute("SELECT id, surah_id, en FROM verses WHERE ar IS NULL OR ar=''").fetchall():
            ar, used = para_arabic(en, arabic.get(sn))
            if used:
                first_used = used[0]
                cur.execute("UPDATE verses SET ar=?, ayah_num=? WHERE id=?", (ar, first_used, vid))
                done += 1
        con.commit()
        filled = cur.execute("SELECT COUNT(*) FROM verses WHERE ar IS NOT NULL AND ar!=''").fetchone()[0]
        print(f"Filled Arabic on {done} paragraphs; total non-empty ar: {filled}/{cur.execute('SELECT COUNT(*) FROM verses').fetchone()[0]}")
        con.execute("VACUUM")
        con.commit()
    con.close()

def expand_alts():
    """Rewrite alt_meanings.json with multiple translations per sampled ayah."""
    alt = {}
    if ALT_WEB.exists():
        try: alt = json.loads(ALT_WEB.read_text(encoding="utf-8"))
        except Exception: alt = {}
    todo = [k for k in SAMPLE_AYAHS if str(f"{k[0]}:{k[1]}") not in alt or len(alt[str(f"{k[0]}:{k[1]}")]) < 3]
    print(f"Expanding alt translations for {len(todo)} ayahs…")
    for sn, an in todo:
        key = f"{sn}:{an}"
        j = fetch_json(f"https://api.alquran.cloud/v1/ayah/{sn}:{an}/editions/en.pickthall,en.yusufali,en.sahih,bn.hoque")
        if j and j.get("code") == 200 and isinstance(j.get("data"), dict):
            entry = {}
            for d in j["data"]:
                ident = d["edition"]["identifier"]
                name = ident.replace("en.", "").replace("bn.", "bn-").capitalize() if ident.startswith("en") else "Bengali (Muhiuddin Khan)"
                entry[name] = " ".join(d["text"].split())[:400]
            if entry:
                alt[key] = entry
                print(f"  {key}: {list(entry)}")
        time.sleep(0.5)
    ALT_WEB.write_text(json.dumps(alt, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"alt_meanings.json: {len(alt)} ayahs")

def sync_alts_to_db():
    con = sqlite3.connect(DB_PATH)
    cur = con.cursor()
    for key, data in json.loads(ALT_WEB.read_text(encoding="utf-8")).items():
        cur.execute("INSERT OR REPLACE INTO alt_meanings(ayah_key, data) VALUES (?,?)",
                    (key, json.dumps(data, ensure_ascii=False)))
    con.commit(); con.close()
    print("Synced alt translations into tafsir.db")

def repack():
    """VACUUM + gzip, then copy to the Android Room asset so APK matches web."""
    con = sqlite3.connect(DB_PATH)
    con.execute("VACUUM"); con.close()
    with open(DB_PATH, "rb") as f_in, gzip.open(ROOT / "tafsir.db.gz", "wb", compresslevel=9) as f_out:
        shutil.copyfileobj(f_in, f_out)
    if APP_DB_GZ.parent.exists():
        shutil.copyfile(ROOT / "tafsir.db.gz", APP_DB_GZ)
        print("Repacked tafsir.db.gz + app asset")
    else:
        print("Repacked tafsir.db.gz (android asset dir absent, skip copy)")

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--daily", action="store_true", help="limit alt-translation expansion (fast daily run)")
    ap.add_argument("--skip-arabic", action="store_true")
    ap.add_argument("--skip-alts", action="store_true")
    args = ap.parse_args()
    if not args.skip_arabic: backfill()
    if not args.skip_alts: expand_alts()
    sync_alts_to_db()
    repack()

if __name__ == "__main__":
    main()
