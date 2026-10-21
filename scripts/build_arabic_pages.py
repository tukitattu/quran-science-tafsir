#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Build one Arabic-only reading page per surah: chapters/<n>/arabic.html

Source: assets/data/quran_ar.json (full Uthmani text) and the surah names in
assets/data/chapters.js. Deterministic — no timestamps, safe to re-run.
"""
import html
import json
import re
import pathlib
import re
import shutil
import subprocess

ROOT = pathlib.Path(__file__).resolve().parents[1]
QURAN_AR = ROOT / "assets/data/quran_ar.json"
CHAPTERS_JS = ROOT / "assets/data/chapters.js"
OUT = ROOT / "chapters"
DIGITS = str.maketrans("0123456789", "٠١٢٣٤٥٦٧٨٩")

PAGE = """<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{ar} — النص العربي · Scientific Tafsir</title>
  <meta name="description" content="{en} — النص القرآني بالرسم العثماني، {count} آية">
  <meta name="theme-color" content="#F8F8F4">
  <link rel="manifest" href="../../manifest.json">
  <link rel="stylesheet" href="../../assets/css/style.css">
  <link rel="apple-touch-icon" href="../../assets/apple-touch-icon.png">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📖</text></svg>">
</head>
<body class="content-ar" data-surah="{n}">
  <a class="skip-link" href="#main">Skip to content</a>
  <header class="topbar">
    <a class="brand" href="../../index.html">
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
      <span class="txt" style="line-height:1.3">
        <span>Scientific Tafsir</span>
        <span class="ar-tag" style="display:block">التفسير العلمي للقرآن الكريم</span>
      </span>
    </a>
    <div class="top-actions">
      <button class="btn" data-play-surah="{n}" title="استماع التلاوة كاملة">▶ تلاوة</button>
      <a class="btn ghost" href="../{n}.html" style="text-decoration:none">التفسير</a>
    </div>
  </header>

  <div class="chapter-head">
    <div class="breadcrumbs"><a href="../../index.html">الرئيسية</a> › <a href="../{n}.html">سورة {ar}</a> › النص العربي</div>
    <h1><span class="arabic-text">{ar}</span></h1>
    <span class="sh-en">{en} · {count} آيات</span>
    <p class="wbw-hint">اضغط أي كلمة لمعناها بالعربية والإنجليزية والبنغالية · اضغط رقم الآية لسماعها</p>
    <div class="ayah-nav">
      {prev}
      <a class="btn ghost" href="../{n}.html">التفسير الكامل</a>
      {next}
    </div>
  </div>

  <main class="read-wrap" id="main">
    <div class="ayah-list">
{ayahs}
    </div>
    <div class="ayah-nav" style="margin:24px 0 40px">
      {prev}
      {next}
    </div>
  </main>
  <script src="../../assets/js/player.js"></script>
  <script src="../../assets/js/wbw.js"></script>
  <script src="../../assets/js/ux-mobile.js"></script>
  <script src="../../assets/js/notes.js"></script>
  <script src="../../assets/js/rootspanel.js"></script>
  <script>
    if ('serviceWorker' in navigator) {{
      navigator.serviceWorker.register('../../sw.js').catch(function () {{}});
    }}
  </script>
</body>
</html>
"""

AR_LETTER = re.compile(r"[\u0621-\u064a]")
AYAH = ('      <div class="ayah" id="a{a}" data-a="{a}">\n'
        '        <span class="ayah-num playable" data-play-ayah="{s}:{a}"\n'
        '              role="button" tabindex="0" title="استمع لهذه الآية">{num}</span>\n'
        '        <p class="ar">{text}</p>\n'
        '      </div>')


def letter_tokens(text):
    return [t for t in text.replace("\ufeff", "").split() if AR_LETTER.search(t)]


def render_ayah(n, a, text, words):
    """Wrap each letter-token in a .wbw span when alignment with the
    word-by-word data is safe (6235/6236 ayahs align; basmala-in-ayah-1
    and pause marks handled). Falls back to plain text otherwise."""
    tokens = text.replace("\ufeff", "").split()
    if words:
        lcount = len(letter_tokens(text))
        skip = 0
        if lcount == len(words) + 4 and a == 1 and n > 1:
            skip = 4  # quran_ar embeds the basmala inside 1:1
        elif lcount != len(words):
            words = None  # tokenisation mismatch — plain text
    parts, i = [], 0
    for t in tokens:
        esc = html.escape(t)
        if words and AR_LETTER.search(t):
            i += 1
            if i > skip:
                parts.append(f'<span class="wbw" data-s="{n}" data-a="{a}" '
                             f'data-p="{i}">{esc}</span>')
            else:
                parts.append(esc)
        else:
            parts.append(esc)
    return " ".join(parts)


def surah_names():
    node = shutil.which("node")
    if not node:
        raise SystemExit("node is required to read assets/data/chapters.js")
    script = (
        "const fs=require('fs');"
        f"const s=fs.readFileSync({str(CHAPTERS_JS)!r},'utf8');"
        "const src=s.replace(/^\\s*const QURAN\\s*=\\s*/,'').replace(/;\\s*$/,'');"
        "const q=eval('('+src+')');"
        "process.stdout.write(JSON.stringify(q.chapters||{}));"
    )
    raw = subprocess.check_output([node, "-e", script], text=True)
    chapters = json.loads(raw)
    if isinstance(chapters, list):
        return {int(v.get("n", i + 1)): v for i, v in enumerate(chapters)}
    return {int(k): v for k, v in chapters.items()}


def wbw_for(n):
    f = ROOT / "assets" / "data" / "wbw" / f"{n}.json"
    if not f.exists():
        return {}
    try:
        d = json.loads(f.read_text(encoding="utf-8"))
    except Exception:
        return {}
    return {int(r["a"]): r["w"] for r in d.get("ayahs", [])}


def main():
    quran = json.loads(QURAN_AR.read_text(encoding="utf-8-sig"))
    names = surah_names()
    written = 0
    for n in range(1, 115):
        ayahs = quran.get(str(n)) or {}
        if not ayahs:
            print(f"! no Arabic text for surah {n}")
            continue
        meta = names.get(n, {})
        wbw = wbw_for(n)
        blocks = []
        for a in sorted(ayahs, key=lambda k: int(k)):
            text = str(ayahs[a]).replace("\ufeff", "").strip()
            blocks.append(AYAH.format(
                s=n,
                a=int(a),
                num=str(int(a)).translate(DIGITS),
                text=render_ayah(n, int(a), text, wbw.get(int(a)))))
        prev_link = (f'<a class="btn ghost" href="../{n-1}/arabic.html">← السورة السابقة</a>'
                     if n > 1 else "<span></span>")
        next_link = (f'<a class="btn ghost" href="../{n+1}/arabic.html">السورة التالية →</a>'
                     if n < 114 else "<span></span>")
        page = PAGE.format(
            n=n,
            ar=html.escape(meta.get("ar") or f"سورة {n}"),
            en=html.escape(meta.get("en") or f"Surah {n}"),
            count=str(len(ayahs)).translate(DIGITS),
            ayahs="\n".join(blocks),
            prev=prev_link,
            next=next_link,
        )
        target = OUT / str(n) / "arabic.html"
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(page, encoding="utf-8")
        written += 1
    print(f"build_arabic_pages: wrote {written} pages")


if __name__ == "__main__":
    main()
