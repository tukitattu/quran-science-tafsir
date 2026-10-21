#!/usr/bin/env python3
"""Build word-by-word meaning files for all 114 surahs.

Source: quran.com public API v4 (per-word English + Bengali translations,
transliteration, word audio id) — verified free-to-use public endpoints.

  --refresh : fetch from the API and rewrite assets/data/wbw/*.json
  --check   : validate committed files without network (CI default)

Output per surah: assets/data/wbw/{n}.json
  {"surah":1,"src":"quran.com","ayahs":[{"a":1,"w":[
     {"t":"بِسْمِ","en":"In (the) name","bn":"নামে","tr":"bis'mi",
      "au":"wbw/001_001_001.mp3"}]}]}
"""
import json, pathlib, sys, time, urllib.request, urllib.error

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "data" / "wbw"
API = ("https://api.quran.com/api/v4/verses/by_chapter/{s}"
       "?words=true&word_fields=text_uthmani,translations,transliteration"
       "&language={lang}&per_page=100&page={p}")
UA = {"User-Agent": "quran-science-tafsir-data-builder/1.0 (open source)"}


def http_json(url, tries=4):
    last = None
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers=UA)
            with urllib.request.urlopen(req, timeout=40) as r:
                return json.loads(r.read().decode("utf-8"))
        except Exception as e:  # noqa: BLE001 - retry any transport error
            last = e
            time.sleep(1.0 + i * 1.5)
    raise RuntimeError(f"fetch failed after {tries} tries: {url}: {last}")


def fetch_surah(surah, lang):
    verses, page, total = [], 1, None
    while total is None or page <= total:
        d = http_json(API.format(s=surah, lang=lang, p=page))
        pag = d.get("pagination", {})
        total = pag.get("total_pages") or 1
        verses.extend(d.get("verses", []))
        page += 1
        time.sleep(0.12)
    out = {}
    for v in verses:
        key = v.get("verse_number")
        words = []
        for w in v.get("words", []):
            if w.get("char_type_name") != "word":
                continue  # skip ayah end marks
            tr = w.get("translation") or {}
            tl = w.get("transliteration") or {}
            item = {
                "t": w.get("text_uthmani") or w.get("text") or "",
                "tx": tr.get("text") or "",
                "tl": tl.get("text") or "",
                "au": w.get("audio_url") or "",
            }
            if not item["t"] or not item["tx"]:
                continue
            words.append(item)
        if words:
            out[key] = words
    return out


def quran_ar_counts():
    data = json.loads((ROOT / "assets" / "data" / "quran_ar.json").read_text("utf-8"))
    counts = {}
    for k, v in data.items():
        if isinstance(v, dict):
            counts[int(k)] = len(v)
        elif isinstance(v, list):
            counts[int(k)] = len(v)
    if len(counts) != 114 or sum(counts.values()) != 6236:
        raise SystemExit(f"quran_ar.json: {len(counts)} surahs, "
                         f"{sum(counts.values())} ayahs (expected 114/6236)")
    return counts


def refresh():
    counts = quran_ar_counts()
    OUT.mkdir(parents=True, exist_ok=True)
    problems = []
    for n in range(1, 115):
        en = fetch_surah(n, "en")
        bn = fetch_surah(n, "bn")
        merged = []
        for a in sorted(set(en) | set(bn)):
            en_w, bn_w = en.get(a, []), bn.get(a, [])
            row = []
            for i, w in enumerate(en_w):
                item = {
                    "t": w["t"],
                    "en": w["tx"],
                    "bn": bn_w[i]["tx"] if i < len(bn_w) else "",
                    "tr": w["tl"],
                    "au": w["au"],
                }
                if item["bn"] and i < len(bn_w) and bn_w[i]["t"] != w["t"]:
                    # token alignment mismatch — keep the English token, note gap
                    problems.append(f"{n}:{a} word {i + 1} EN/BN token mismatch")
                    item["bn"] = ""
                row.append(item)
            merged.append({"a": a, "w": row})
        got = sum(len(x["w"]) for x in merged)
        if len(merged) != counts[n]:
            problems.append(f"surah {n}: ayahs {len(merged)} != {counts[n]}")
        text = json.dumps(
            {"surah": n, "src": "quran.com v4 (word-by-word EN/BN)",
             "ayahs": merged},
            ensure_ascii=False, separators=(",", ":"), sort_keys=False) + "\n"
        (OUT / f"{n}.json").write_text(text, encoding="utf-8")
        print(f"wbw {n:>3}: ayahs={len(merged):>3} words={got:>4}")
        time.sleep(0.12)
    if problems:
        print("PROBLEMS:")
        for p in problems:
            print("  ", p)
        raise SystemExit(1)
    print("build_wbw: all 114 surahs OK")


def check():
    counts = quran_ar_counts()
    bad, words_total = [], 0
    for n in range(1, 115):
        f = OUT / f"{n}.json"
        if not f.exists():
            bad.append(f"missing {f.name}")
            continue
        try:
            d = json.loads(f.read_text("utf-8"))
        except Exception as e:  # noqa: BLE001
            bad.append(f"{f.name}: {e}")
            continue
        ayahs = d.get("ayahs", [])
        if len(ayahs) != counts[n]:
            bad.append(f"{f.name}: {len(ayahs)} ayahs != {counts[n]}")
        for row in ayahs:
            for w in row.get("w", []):
                if not w.get("t") or not w.get("en"):
                    bad.append(f"{f.name} {row['a']}: empty word/en")
                    break
                words_total += 1
            else:
                continue
            break
    total_ayahs = 0
    for n in range(1, 115):
        f = OUT / f"{n}.json"
        if f.exists():
            try:
                total_ayahs += len(json.loads(f.read_text("utf-8")).get("ayahs", []))
            except Exception:  # noqa: BLE001
                pass
    if bad:
        print("check FAILED:")
        for b in bad[:20]:
            print("  ", b)
        raise SystemExit(1)
    print(f"build_wbw --check: 114 files, {total_ayahs} ayahs, {words_total} words OK")


if __name__ == "__main__":
    if "--refresh" in sys.argv:
        refresh()
    else:
        check()
