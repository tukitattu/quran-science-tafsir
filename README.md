# Scientific Tafsir of the Quran — Bilingual (English / বাংলা / العربية) Edition

Live multilingual **English · বাংলা · العربية** website and offline Android app for the three-volume **"Scientific Tafsir of the Quran"** by **Zakaria Kamal**.

> **Everything is embedded.** All 114 chapters are fully extracted from the three PDFs and machine-translated into Bengali, with English + Bengali shown side by side. No PDF viewer or PDF download is required to read — every page loads instantly.

- The **book text** is presented in **English and Bengali** (Bengali is a machine translation of the English), with the complete Uthmani Arabic text available ayah by ayah.
- The **website interface and app chrome** are translated into English, Bengali and Arabic (RTL).
- Surah names are shown in Arabic, English and Bengali throughout.
- The original 3 PDF volumes remain downloadable from each part page.

## Structure

```
index.html                 Home: 3 parts + all 114 chapters (372 paginated read pages)
part1.html · part2.html ·  part3.html      Part overviews (chapter grid + PDF download)
chapters/1.html … 114.html Overviews + chapters/1/read/pageX.html paginated tafsir (25 paras/page)
assets/
  css/style.css            UI + reading styles
  js/app.js|tts.js|wiki.js|builder.js  trilingual toggle, TTS (verse-only), deep research, Ghaur o Fikr
  data/chapters.js|surah_knowledge.js|deep_research.js|wiki_map.js|ghaur_ofikr_map.js
  data/quran_ar.json       Complete Uthmani text (114 surahs, 6,236 ayahs)
  data/alt_meanings.json   Alternative translations for all 6,236 ayahs (Pickthall)
  data/wbw/*.json          Word-by-word meanings (77,429 words, EN + BN + transliteration)
  figures/fig_*.jpg        666 figures (pdfimages -png → JPG q78, 109M → 22M)
  pdf/part{1..3}.pdf       original volumes (24M)
tafsir.db[.gz]             SQLite (21M → 6.5M gz): 7,796 paras (EN+BN), 6,236 ayahs,
                           347 words, 114 tafsir rows, alt_meanings, figures, FTS5 search
flutter/                   Android app (Flutter + sqflite + just_audio + local notifications)
sw.js / manifest.json      PWA offline (CACHE tafsir-v12, cache-first for jpg/js)
```

## Contents

| Part | Chapters | PDF volume |
|------|----------|------------|
| Part 1 of 3 | 1 – 9 (Al-Fatihah → At-Tawbah) | `assets/pdf/part1.pdf` (905 pp) |
| Part 2 of 3 | 10 – 30 (Yunus → Ar-Rum) | `assets/pdf/part2.pdf` (825 pp) |
| Part 3 of 3 | 31 – 114 (Luqman → An-Nas) | `assets/pdf/part3.pdf` (848 pp) |

## Features

- **No PDF loading**: paginated reading (`chapters/N/read/pageX.html`, 25 paras/page, 372 pages) — instant, no viewer.
- **Trilingual UI**: one-tap **English · বাংলা · العربية** (full RTL) on the web and in the app.
- **Side-by-side EN/BN**: all 7,796 paras have BN (FTS5-searchable, e.g. `রহমত`).
- **Complete Arabic**: `quran_ayahs` holds all 6,236 Uthmani ayahs; the Arabic reader and the daily-ayah reminder read from it (with a `verses.ar` fallback for older databases).
- **Deep research**: `SURAH_KNOWLEDGE` (114) + `DEEP_RESEARCH` (Amud/Nazm in EN/BN/AR, 347 words with Bayyinah roots, Balagha, GaurFikr).
- **Ghaur o Fikr & Wikipedia**: `WIKI_MAP` + `GHAUR_O_FIKR_MAP` via `fetchKnowledgeData()`; `alt_meanings.json` now covers all 6,236 ayahs (Pickthall, refreshed daily by `update_research.py`).
- **TTS verse-only**: `tts.js` reads only `.verse` (Quranic rule), per-para 🔊, cloud hook `window.TTS_CLOUD_URL`.
- **Complete tilawah**: 6 reciters × 6,236 ayahs (CDN + `everyayah.com` fallback) and 114 whole-surah files per reciter (`cdn.mp3quran.net`, CORS-enabled), plus 77,429 word pronunciations (`audio.qurancdn.com`). Audio is streamed from free public CDNs, never bundled.
- **Kids & Builder**: `Kids` toggle + daily streak, `builder.js` tadabbur picker (localStorage + URL hash).
- **Vocabulary**: 82-word `vocabulary.html` with categories + 5-word quiz (flashcard).
- **Offline PWA + APK**: `sw.js` v14 caches all chapters/read pages/assets, `manifest.json`, Flutter app bundles `tafsir.db.gz` and word-by-word audio metadata; GitHub Releases publish `arm64-v8a`, `armeabi-v7a` and `x86_64` APKs built by `flutter-apk.yml`.

## How it was built

1. `pdftotext -layout` → `paras.json` (7,796 paras) + `pdfimages -png` → 666 figs (JPG q78).
2. `translate` EN→BN via `clients5.google.com/translate_a/t?client=dict-chrome-ex` (SEP ␟, cached `trans_cache.json` 7,796, 3 workers).
3. `gen_site.py` emits 114 overviews + 372 `chapters/N/read/pageX.html` (smart nav) + `vocabulary.html`.
4. `scripts/build_db.py` → `tafsir.db` (VACUUM + gzip, FTS5); `scripts/backfill_arabic_local.py` adds `quran_ayahs` (6,236) + FTS, syncs `alt_meanings` and refreshes the Flutter asset.
5. `scripts/update_research.py --daily` (03:00 UTC, `Daily Research Update` workflow) refreshes `alt_meanings.json` from AlQuran.cloud.
6. `flutter build apk --split-per-abi` in `flutter-apk.yml`, triggered on each GitHub Release.

## Development

```bash
python3 -m http.server 8000                 # static site
python3 scripts/build_wbw.py --check        # validate word-by-word data
python3 scripts/build_audio.py --check      # validate audio manifest
python3 scripts/backfill_arabic_local.py    # rebuild quran_ayahs/alt_meanings + flutter/assets/tafsir.db.gz
python3 scripts/update_research.py --daily  # refresh alt_meanings.json
cd flutter && flutter pub get && flutter build apk --split-per-abi
```

Notes: the full `build_db.py` pipeline needs `paras.json` / `trans_cache.json` (generated from the PDFs, not committed); day-to-day Arabic/alt-meaning maintenance goes through `backfill_arabic_local.py`, which patches the existing database in place.

## License

Content: the original book is freely shareable per the author's notice. Bengali translation: machine-generated for convenience. Code: MIT.
