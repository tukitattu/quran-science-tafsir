#!/usr/bin/env python3
"""Build assets/data/words_export.json (v2) from tafsir.db.

Adds to each word record:
  ref      "surah:ayah" parsed from the corpus reference when available
  ar_norm  normalised arabic form for exact-match lookups
  cat      a topic category (business, mercy, justice, ...)
  srch     lower-cased trilingual search blob (en + bn + why + root + ar_norm)

Usage: python3 scripts/build_words_export.py
"""
import json
import os
import re
import sqlite3

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB = os.path.join(BASE, "tafsir.db")
OUT = os.path.join(BASE, "assets", "data", "words_export.json")

AR_DIACRITICS = re.compile(r"[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640]")


def norm_ar(s):
    s = (s or "").replace("\ufeff", "")
    s = AR_DIACRITICS.sub("", s)
    for a, b in (("\u0671", "\u0627"), ("\u0622", "\u0627"), ("\u0623", "\u0627"),
                 ("\u0625", "\u0627"), ("\u0649", "\u064a"), ("\u0629", "\u0647")):
        s = s.replace(a, b)
    return s.strip()


CATEGORIES = [
    ("business", ["trade", "trading", "tijar", "buy", "buying", "sell", "selling", "sale",
                  "profit", "riba", "usury", "usurer", "measure", "measuring", "weight",
                  "weigh", "debt", "debtor", "market", "wealth", "money", "business",
                  "commerce", "contract", "rizq", "livelihood", "earn", "earning", "price",
                  "merchandise", "capital", "loan", "interest", "hoard", "cheat", "bargain"]),
    ("prayer", ["prayer", "salat", "salah", "worship", "sujud", "prostration", "prostrate",
                "mosque", "masjid", "zakat", "fast", "fasting", "ramadan", "pilgrim",
                "pilgrimage", "hajj", "dhikr", "invoke", "invocation", "tahlil"]),
    ("justice", ["justice", "just", "oppress", "oppression", "wrong", "wrongdoer", "adl",
                 "qist", "judgement", "judgment", "judge", "law", "right", "evidence",
                 "witness", "balance", "equity", "tyranny"]),
    ("mercy", ["mercy", "merciful", "rahma", "forgive", "forgiveness", "compassion", "kindness"]),
    ("patience", ["patience", "patient", "sabr", "endure", "perseverance", "trial", "trials",
                  "hardship", "affliction"]),
    ("family", ["family", "wife", "husband", "child", "children", "parent", "parents",
                "mother", "father", "marriage", "kin", "orphan", "inherit", "inheritence",
                "spouse", "offspring", "womb"]),
    ("prophets", ["prophet", "prophets", "messenger", "messengers", "nabi", "rasul", "moses",
                  "jesus", "abraham", "noah", "adam", "israel", "revealed", "revelation"]),
    ("afterlife", ["hereafter", "akhira", "paradise", "janna", "hell", "hellfire", "fire",
                   "resurrection", "resurrect", "judgment day", "death", "grave", "reward",
                   "punishment", "punish", "qiyamah", "recompense"]),
    ("creation", ["creation", "create", "created", "creator", "universe", "heaven", "heavens",
                  "sky", "earth", "star", "stars", "sun", "moon", "water", "light", "life",
                  "soul", "nafs", "ruh", "spirit", "science", "scientific", "nature", "atom",
                  "force", "field", "matter", "particle", "time", "space"]),
    ("faith", ["faith", "belief", "iman", "believe", "believer", "disbelieve", "disbeliever",
               "hypocrite", "hypocrisy", "munafiq", "kufr", "shirk", "idol", "idols",
               "sincerity", "ikhlas", "taqwa", "god", "allah", "lord", "rabb", "divine",
               "gratitude", "thankful", "praise"]),
    ("language", ["root", "form", "grammar", "noun", "verb", "pattern", "linguistic",
                  "morphology", "sarf", "balagha", "rhetoric", "arabic", "letter"]),
    ("knowledge", ["knowledge", "know", "knower", "ilim", "learn", "wisdom", "hikmah",
                   "teach", "teacher", "scripture", "book", "sign", "signs", "ayah", "verses",
                   "read", "reading", "understand", "mind", "guidance", "guide"]),
]


def is_placeholder(w):
    return bool(re.match(r"^كلمة\d+$", w or ""))


def classify(*fields):
    hay = " ".join(f or "" for f in fields).lower()
    for name, keys in CATEGORIES:
        for k in keys:
            if re.search(r"(?<![a-z])" + re.escape(k) + r"(?![a-z])", hay):
                return name
    return "general"


def main():
    con = sqlite3.connect(DB)
    con.row_factory = sqlite3.Row
    rows = con.execute("select * from words").fetchall()
    pos = con.execute("select surah_id, count(*) c from words group by surah_id").fetchall()

    out = []
    seen_keys = set()
    for r in rows:
        d = dict(r)
        # tafsir.db carries duplicated filler rows for two sample words across
        # every surah — collapse identical records so the list stays clean.
        dup_key = (d.get("w"), d.get("en"), d.get("why"))
        if dup_key in seen_keys:
            continue
        seen_keys.add(dup_key)
        ra = d.get("root_analysis")
        try:
            ra_obj = json.loads(ra) if ra else None
        except Exception:
            ra_obj = None
        ref = None
        if ra_obj and ra_obj.get("corpus_ref"):
            m = re.search(r"chapter=(\d+).*?verse=(\d+)", ra_obj["corpus_ref"])
            if m:
                ref = f"{m.group(1)}:{m.group(2)}"
        if not ref and d.get("surah_id"):
            ref = f"{d['surah_id']}:1"
        try:
            am = json.loads(d.get("alternative_meanings") or "[]")
        except Exception:
            am = []
        rec = {
            "id": len(out) + 1,
            "surah": d.get("surah_id"),
            "w": d.get("w"),
            "tr": d.get("tr"),
            "root": d.get("root"),
            "form": d.get("form"),
            "why": d.get("why"),
            "en": d.get("en"),
            "bn": d.get("bn"),
            "ra": ra_obj,
            "am": am,
            "ref": ref,
            "ar_norm": norm_ar(d.get("w")),
            "cat": "pending" if is_placeholder(d.get("w")) else classify(
                d.get("en"), d.get("why"), d.get("root")),
        }
        rec["srch"] = " ".join(filter(None, [
            rec["w"], rec["ar_norm"], rec["tr"], rec["en"], rec["bn"],
            rec["root"], rec["form"], rec["why"], rec["cat"],
        ])).lower()
        out.append(rec)

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as fh:
        json.dump(out, fh, ensure_ascii=False, separators=(",", ":"))
    cats = {}
    for x in out:
        cats[x["cat"]] = cats.get(x["cat"], 0) + 1
    print(f"wrote {OUT}: {len(out)} words, categories={cats}")


if __name__ == "__main__":
    main()
