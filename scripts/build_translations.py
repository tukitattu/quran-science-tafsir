#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Build per-surah translation files: assets/data/tr/{surah}.json

Sources (all public editions bundled by eQuran / engineersTech, itself built
from the widely distributed Tanzil/Quran.com translations):

  en      Saheeh International (English)
  bq      Islamic Foundation Bangladesh (Bangla)
  taisir  Taisirul Quran — Tawheed Publications (Bangla)
  bayan   Al-Bayan — Bayan Foundation (Bangla)
  mujib   Sheikh Mujibur Rahman — Darussalam (Bangla)
  khan    Maulana Muhiuddin Khan — Ma'ariful Qur'an (Bangla)
  hoque   Zahurul Haque (Bangla)

Each ayah also carries the transliteration (`tr`), Bangla pronunciation (`uc`)
and the Bangla footnotes (`fn`) from the same public dataset.

Usage: python3 scripts/build_translations.py [--src /tmp/opencode/eqdata]
Deterministic and offline once the source data is present.
"""
import argparse, json, pathlib

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / "assets/data/tr"
SOURCES = [
    ("en", "Saheeh International"),
    ("bq", "Islamic Foundation Bangladesh"),
    ("taisir", "Taisirul Quran"),
    ("bayan", "Al-Bayan"),
    ("mujib", "Sheikh Mujibur Rahman"),
    ("khan", "Muhiuddin Khan"),
    ("hoque", "Zahurul Haque"),
]

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", default="/tmp/opencode/eqdata")
    ap.add_argument("--out", default=str(OUT))
    args = ap.parse_args()
    src = pathlib.Path(args.src)
    outdir = pathlib.Path(args.out)
    outdir.mkdir(parents=True, exist_ok=True)

    total_bytes = 0
    for s in range(1, 115):
        meta = json.loads((src / "s" / f"{s}.json").read_text(encoding="utf-8"))
        translations = {}
        for key, _label in SOURCES:
            p = src / "t" / key / f"{s}.json"
            translations[key] = json.loads(p.read_text(encoding="utf-8")) if p.exists() else []

        ayahs = []
        for row in meta.get("ayahs", []):
            n = int(row.get("n") or len(ayahs) + 1)
            rec = {"a": n}
            if row.get("ar"):
                rec["ar"] = row["ar"]
            for key, _label in SOURCES:
                arr = translations.get(key) or []
                if n - 1 < len(arr):
                    rec[key] = arr[n - 1]
            for k in ("tr", "uc"):
                if row.get(k):
                    rec[k] = row[k]
            fn = row.get("fn") or {}
            if fn:
                rec["fn"] = fn
            ayahs.append(rec)

        payload = {
            "s": s,
            "sources": [{"id": k, "name": v} for k, v in SOURCES],
            "ayahs": ayahs,
        }
        if meta.get("intro"):
            payload["intro"] = meta["intro"]
        if meta.get("fu"):
            payload["fu"] = meta["fu"]
        text = json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
        (outdir / f"{s}.json").write_text(text, encoding="utf-8")
        total_bytes += len(text.encode("utf-8"))

    print(f"translations: 114 surah files, {total_bytes/1024/1024:.2f} MB total")

if __name__ == "__main__":
    main()
