#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Clean and bundle the public eQuran knowledge datasets.

Source: https://equran.alshahriar.dev/ (engineersTech) — public data files
(`data/names.json`, `duas.json`, `learn.json`, `daily.json`, `topics.json`).
The content itself is the Qur'an, well-known du'as, and standard fiqh guides.

Outputs (web + Flutter copies):
  assets/data/more/names.json   — 99 names of Allah
  assets/data/more/duas.json    — 12 categories / 70+ du'as
  assets/data/more/learn.json   — 10 step-by-step guides
  assets/data/more/daily.json   — 61 daily ayahs + 50 hadith
  assets/data/more/topics.json  — 16 topic collections

Deterministic, offline once /tmp/opencode/eqdata is present.
"""
import json, pathlib, shutil

ROOT = pathlib.Path(__file__).resolve().parents[1]
SRC = pathlib.Path("/tmp/opencode/eqdata")
OUT = ROOT / "assets/data/more"
FL = ROOT / "flutter/assets/data/more"
OUT.mkdir(parents=True, exist_ok=True)
FL.mkdir(parents=True, exist_ok=True)

def load(name):
    return json.loads((SRC / name).read_text(encoding="utf-8"))

def save(name, obj):
    text = json.dumps(obj, ensure_ascii=False, separators=(",", ":"))
    (OUT / name).write_text(text, encoding="utf-8")
    (FL / name).write_text(text, encoding="utf-8")
    print(f"{name:12} {len(text)/1024:8.1f} KB")

names = load("names.json")
for n in names:
    n.pop("uc", None)
save("names.json", {"src": "eQuran / engineersTech", "names": names})

duas = load("duas.json")
total = 0
for cat in duas:
    for it in cat.get("items", []):
        it.pop("au", None)
        total += 1
save("duas.json", {"src": "eQuran / engineersTech", "categories": duas})
print("  duas:", total)

learn = load("learn.json")
for g in learn:
    for st in g.get("steps", []):
        st.pop("au", None)
save("learn.json", {"src": "eQuran / engineersTech", "guides": learn})

daily = load("daily.json")
save("daily.json", daily)

topics = load("topics.json")
save("topics.json", {"src": "eQuran / engineersTech", "topics": topics})
