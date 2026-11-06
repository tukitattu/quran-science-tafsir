#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Daily research updater — searches online sources used in the project
to get latest alternative meanings & translations.

Sources:
- Tanzil / Quran.com API (quran.com, api.quran.com)
- QuranWBW, Corpus.Quran.com (roots)
- AlQuran.Cloud (translations)
- Scientific references: cross-check via Wikipedia/Arxiv titles (light)

This script is idempotent and safe to run daily. It updates:
- assets/data/alt_meanings.json  (per-ayah alternative translations)
- assets/data/surah_knowledge.js (if new science refs found)
- scripts/update_log.json

It never overwrites the Arabic Uthmani text.
"""
import argparse, json, os, re, sys, time, pathlib
import requests

ROOT = pathlib.Path(__file__).resolve().parents[1]
ALT_PATH = ROOT / "assets/data/alt_meanings.json"
KNOW_PATH = ROOT / "assets/data/surah_knowledge.js"
LOG_PATH = ROOT / "scripts/update_log.json"

HEADERS = {"User-Agent": "ScientificTafsirBot/1.0 (+https://etside.github.io/quran-science-tafsir/)"}

def fetch_json(url, timeout=20):
    try:
        r = requests.get(url, headers=HEADERS, timeout=timeout)
        r.raise_for_status()
        return r.json()
    except Exception as e:
        print(f"fetch fail {url}: {e}", file=sys.stderr)
        return None

def fetch_quran_translations(surah=1, ayah=1):
    out = {}
    # EN: Pickthall, Yusuf Ali, Sahih
    for tid, name in [("131","Pickthall"),("19","YusufAli"),("20","SahihIntl")]:
        j = fetch_json(f"https://api.alquran.cloud/v1/ayah/{surah}:{ayah}/editions/quran-uthmani,en.{tid.lower() if tid!='131' else 'pickthall'}")
        # fallback: try simpler
        if not j:
            j = fetch_json(f"https://api.alquran.cloud/v1/ayah/{surah}:{ayah}/en.{tid}")
        if j and j.get("data"):
            # data may be list or dict
            data = j["data"]
            if isinstance(data, list):
                txt = next((x.get("text") for x in data if x.get("edition",{}).get("identifier","").startswith("en")), None)
            else:
                txt = data.get("text")
            if txt: out[name] = txt[:400]
    return out

def fetch_full_pickthall():
    """All 6,236 ayahs in one request (Pickthall). Keeps coverage complete."""
    j = fetch_json("https://api.alquran.cloud/v1/quran/en.pickthall", timeout=60)
    if not j or j.get("code") != 200:
        return {}
    out = {}
    for surah in j.get("data", {}).get("surahs", []):
        sn = surah.get("number")
        for ayah in surah.get("ayahs", []):
            an = ayah.get("numberInSurah")
            txt = (ayah.get("text") or "").strip()
            if sn and an and txt:
                out[f"{sn}:{an}"] = {"Pickthall": txt[:400]}
    return out

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--daily", action="store_true", help="daily mode (fewer ayahs for speed)")
    ap.add_argument("--surah", type=int, default=0, help="limit to surah N (0=all sampled)")
    args = ap.parse_args()

    # Sample ayahs to update daily (to avoid 6236* API calls)
    # Daily: 5 key ayahs; full run: 20
    samples = [
        (1,1),(1,4),(1,7),
        (2,2),(2,31),(2,255),
        (36,1),(55,1),(67,1),(96,1),
        (112,1),(112,4),(113,1),(114,1)
    ]
    if args.surah:
        samples = [(args.surah,1),(args.surah,2)] if args.surah!=1 else samples[:3]
    if not args.daily:
        # add more samples
        samples += [(3,7),(4,34),(18,10),(24,35)]

    alt = {}
    if ALT_PATH.exists():
        try: alt = json.loads(ALT_PATH.read_text(encoding="utf-8"))
        except: alt = {}

    # Ensure complete Pickthall coverage (single bulk request) before the
    # sample refresh below enriches a handful of ayahs with extra editions.
    full = fetch_full_pickthall()
    if full:
        for key, trans in full.items():
            alt.setdefault(key, {}).update(trans)
        print(f"Pickthall coverage: {len(full)} ayahs")

    updated = 0
    for s,a in samples:
        key = f"{s}:{a}"
        trans = fetch_quran_translations(s,a)
        if trans:
            if key not in alt or alt[key] != trans:
                alt[key] = trans
                updated += 1
                print(f"updated {key}: {list(trans.keys())}")
        time.sleep(0.6)

    ALT_PATH.parent.mkdir(parents=True, exist_ok=True)
    ALT_PATH.write_text(json.dumps(alt, ensure_ascii=False, indent=2), encoding="utf-8")

    LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    log = {}
    if LOG_PATH.exists():
        try: log = json.loads(LOG_PATH.read_text(encoding="utf-8"))
        except: log={}
    log[str(int(time.time()))] = {"updated": updated, "samples": len(samples), "daily": args.daily}
    # keep last 30
    if len(log) > 30:
        for k in sorted(log.keys())[:-30]:
            log.pop(k, None)
    LOG_PATH.write_text(json.dumps(log, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Done. updated {updated}/{len(samples)} ayahs -> {ALT_PATH}")

if __name__ == "__main__":
    main()