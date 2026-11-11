#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Build assets/data/words_index.json — every distinct Quranic word form.

Aggregates the committed word-by-word files (assets/data/wbw/*.json, quran.com
v4 EN/BN/transliteration) into one compact frequency index:

    { "w": "ٱلْحَمْدُ", "tr": "al-ḥamdu", "en": "All praises", "bn": "সকল প্রশংসা",
      "n": 5, "s": 1, "a": 2, "ref": "1:2", "refs": ["1:2", ...],
      "ar_norm": "...", "cat": "prayer", "srch": "..." }

The curated deep-study entries in words_export.json keep their roots, forms,
"why this word" notes and alternative meanings; this index supplies the rest of
the vocabulary (21k+ forms) so the explorer is no longer limited to ~130 words.

Deterministic, offline, safe to re-run.
"""
import json, pathlib, re, collections, gzip

ROOT = pathlib.Path(__file__).resolve().parents[1]
WBW = ROOT / "assets/data/wbw"
OUT = ROOT / "assets/data/words_index.json"
OUT_GZ = ROOT / "flutter/assets/words_index.json.gz"

AR_DIAC = re.compile(r"[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640]")

def norm_ar(s: str) -> str:
    s = AR_DIAC.sub("", s or "")
    s = s.replace("أ", "ا").replace("إ", "ا").replace("آ", "ا").replace("ٱ", "ا")
    s = s.replace("ى", "ي").replace("ة", "ه")
    return s.strip()

# lightweight topical classification from the English/Bangla gloss
CATS = [
    ("business", ("trade", "buy", "sell", "weigh", "measure", "debt", "wealth", "money", "market", "profit", "usury", "riba", "business", "merchandise", "price", "wage", "borrow", "lend", "spend", "spending", "provision", "livelihood", "earning", "property", "inherit", "inheritance", "gold", "silver", "دينار", "تجار", "بيع", "شرا", "সুদ", "ব্যবসা", "সম্পদ", "ধন", "মাপ", "ওজন", "ঋণ")),
    ("mercy", ("mercy", "merciful", "compassion", "forgive", "forgiveness", "pardon", "kind", "grace", "blessing", "রহম", "দয়া", "ক্ষমা", "করুণা")),
    ("prayer", ("prayer", "pray", "worship", "prostrate", "bow", "mosque", "salah", "zakah", "charity", "fast", "pilgrimage", "hajj", "নামাজ", "সালাত", "সিজদা", "ইবাদত", "রোজা", "হজ", "যাকাত")),
    ("justice", ("justice", "just", "oppress", "wrong", "judge", "judgment", "witness", "equity", "fair", "injustice", "ন্যা", "বিচার", "সাক্ষ্য", "জুলুম", "অন্যায়")),
    ("knowledge", ("know", "knowledge", "learn", "book", "read", "wisdom", "sign", "verse", "teach", "truth", "জ্ঞান", "কিতাব", "পড়", "শেখ", "প্রজ্ঞা", "আয়াত", "সত্য")),
    ("patience", ("patience", "patient", "persevere", "steadfast", "endure", "sabr", "ধৈর্য", "সবর", "অধৈর্য")),
    ("creation", ("create", "creation", "heaven", "earth", "sky", "sun", "moon", "star", "mountain", "sea", "river", "wind", "rain", "tree", "plant", "animal", "bird", "water", "fire", "light", "night", "day", "সৃষ্টি", "আকাশ", "পৃথিবী", "সূর্য", "চাঁদ", "তারা", "পাহাড়", "সমুদ্র", "নদী", "বাতাস", "বৃষ্টি", "গাছ", "পানি", "আগুন", "আলো", "রাত", "দিন")),
    ("afterlife", ("hereafter", "paradise", "hell", "resurrection", "judgment day", "grave", "reward", "punishment", "angel", "soul", "death", " afterlife", "জান্নাত", "জাহান্নাম", "আখিরাত", "কিয়ামত", "মৃত্যু", "আত্মা", "ফেরেশতা", "পুরস্কার", "শাস্তি")),
    ("family", ("father", "mother", "parent", "son", "daughter", "child", "wife", "husband", "marriage", "family", "brother", "sister", "orphan", "birth", "womb", "বাবা", "মা", "পিতা", "মাতা", "পুত্র", "কন্যা", "সন্তান", "স্ত্রী", "স্বামী", "বিবাহ", "পরিবার", "ভাই", "বোন", "এতিম")),
    ("prophets", ("prophet", "messenger", "moses", "jesus", "abraham", "noah", "adam", "muhammad", "israel", "david", "solomon", "joseph", "jonah", "nuh", "ibrahim", "musa", "ঈসা", "মূসা", "ইব্রাহিম", "নূহ", "আদম", "মুহাম্মদ", "নবী", "রাসূল")),
    ("faith", ("believe", "faith", "iman", "unbeliever", "disbeliever", "hypocrite", "idol", "polytheism", "tawhid", "oneness", "islam", "muslim", "guidance", "misguidance", "ঈমান", "বিশ্বাস", "কাফির", "মুনাফিক", "মূর্তি", "শিরক", "তাওহিদ", "ইসলাম", "মুসলিম", "হেদায়েত")),
]

def classify(en: str, bn: str) -> str:
    hay = (en + " " + bn).lower()
    for cat, keys in CATS:
        for k in keys:
            if k in hay:
                return cat
    return "general"

def main():
    counts = collections.Counter()
    first = {}
    gloss_en = collections.defaultdict(collections.Counter)
    gloss_bn = collections.defaultdict(collections.Counter)
    trs = collections.defaultdict(collections.Counter)
    refs = collections.defaultdict(list)
    surface = {}

    for s in range(1, 115):
        p = WBW / f"{s}.json"
        if not p.exists():
            continue
        d = json.loads(p.read_text(encoding="utf-8"))
        for row in d.get("ayahs", []):
            a = row.get("a")
            for w in row.get("w", []):
                t = (w.get("t") or "").strip()
                if not t:
                    continue
                key = norm_ar(t)
                if not key:
                    continue
                counts[key] += 1
                if key not in first:
                    first[key] = (s, a)
                    surface[key] = t
                if len(refs[key]) < 8 and (not refs[key] or refs[key][-1] != f"{s}:{a}"):
                    refs[key].append(f"{s}:{a}")
                if w.get("en"):
                    gloss_en[key][w["en"]] += 1
                if w.get("bn"):
                    gloss_bn[key][w["bn"]] += 1
                if w.get("tr"):
                    trs[key][w["tr"]] += 1

    out = []
    for key, n in counts.most_common():
        s, a = first[key]
        en = (gloss_en[key].most_common(1) or [("", 0)])[0][0]
        bn = (gloss_bn[key].most_common(1) or [("", 0)])[0][0]
        tr = (trs[key].most_common(1) or [("", 0)])[0][0]
        cat = classify(en, bn)
        out.append({
            "w": surface[key], "tr": tr, "en": en, "bn": bn,
            "n": n, "s": s, "a": a, "ref": f"{s}:{a}", "refs": refs[key][:5],
            "ar_norm": key, "cat": cat,
            "srch": f"{surface[key]} {tr} {en} {bn} {key}".lower(),
        })

    OUT.write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    raw = OUT.read_bytes()
    OUT_GZ.parent.mkdir(parents=True, exist_ok=True)
    with gzip.open(OUT_GZ, "wb", compresslevel=9) as f:
        f.write(raw)
    print(f"words_index: {len(out)} forms, {len(raw)/1024:.0f} KB raw, {OUT_GZ.stat().st_size/1024:.0f} KB gz")
    print("top:", ", ".join(f"{x['w']}({x['n']})" for x in out[:8]))

if __name__ == "__main__":
    main()
