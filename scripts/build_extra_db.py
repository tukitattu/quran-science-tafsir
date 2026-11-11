#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Add the expanded research tables to tafsir.db and repack the Flutter copy.

New tables:
  translations(surah_id, ayah_num, en, bq, taisir, bayan, mujib, khan, hoque,
               translit, pron)
  ayah_notes(surah_id, ayah_num, note)
  surah_intros(surah_id, intro, fu)

Also refreshes assets/data/alt_meanings.json with three full editions
(Pickthall + Saheeh International + Muhiuddin Khan).

Idempotent; run after scripts/build_translations.py.
"""
import gzip, json, pathlib, shutil, sqlite3

ROOT = pathlib.Path(__file__).resolve().parents[1]
DB = ROOT / "tafsir.db"
TR = ROOT / "assets/data/tr"
ALT = ROOT / "assets/data/alt_meanings.json"
APP_DB_GZ = ROOT / "flutter/assets/tafsir.db.gz"

SOURCES = ["en", "bq", "taisir", "bayan", "mujib", "khan", "hoque"]

def main():
    con = sqlite3.connect(DB)
    cur = con.cursor()
    cur.executescript("""
      CREATE TABLE IF NOT EXISTS translations(
        surah_id INTEGER NOT NULL, ayah_num INTEGER NOT NULL,
        en TEXT, bq TEXT, taisir TEXT, bayan TEXT, mujib TEXT, khan TEXT,
        hoque TEXT, translit TEXT, pron TEXT,
        PRIMARY KEY(surah_id, ayah_num));
      CREATE TABLE IF NOT EXISTS ayah_notes(
        surah_id INTEGER NOT NULL, ayah_num INTEGER NOT NULL, note TEXT,
        PRIMARY KEY(surah_id, ayah_num));
      CREATE TABLE IF NOT EXISTS surah_intros(
        surah_id INTEGER PRIMARY KEY, intro TEXT, fu TEXT);
    """)
    cur.execute("DELETE FROM translations")
    cur.execute("DELETE FROM ayah_notes")
    cur.execute("DELETE FROM surah_intros")

    alt = {}
    try:
        alt = json.loads(ALT.read_text(encoding="utf-8"))
    except Exception:
        alt = {}

    rows = 0
    for s in range(1, 115):
        data = json.loads((TR / f"{s}.json").read_text(encoding="utf-8"))
        cur.execute("INSERT OR REPLACE INTO surah_intros VALUES (?,?,?)",
                    (s, data.get("intro", ""), json.dumps(data.get("fu", {}), ensure_ascii=False)))
        for a in data["ayahs"]:
            n = int(a["a"])
            vals = [a.get(k, "") for k in SOURCES]
            cur.execute("INSERT OR REPLACE INTO translations VALUES (?,?,?,?,?,?,?,?,?,?,?)",
                        (s, n, *vals, a.get("tr", ""), a.get("uc", "")))
            if a.get("fn"):
                note = "\n\n".join(f"[{k}] {v}" for k, v in a["fn"].items())
                cur.execute("INSERT OR REPLACE INTO ayah_notes VALUES (?,?,?)", (s, n, note))
            key = f"{s}:{n}"
            rec = alt.get(key) or {}
            if a.get("en"):
                rec["Saheeh International"] = a["en"]
            if a.get("khan"):
                rec["Muhiuddin Khan (বাংলা)"] = a["khan"]
            alt[key] = rec
            rows += 1
    con.commit()
    cur.execute("VACUUM")
    con.commit()
    con.close()

    ALT.write_text(json.dumps(alt, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")

    # repack Flutter DB
    with open(DB, "rb") as f, gzip.open(APP_DB_GZ, "wb", compresslevel=9) as g:
        shutil.copyfileobj(f, g)
    print(f"translations rows: {rows}")
    print(f"db: {DB.stat().st_size/1024/1024:.1f} MB  gz: {APP_DB_GZ.stat().st_size/1024/1024:.1f} MB")
    print(f"alt_meanings: {ALT.stat().st_size/1024/1024:.1f} MB")

if __name__ == "__main__":
    main()
