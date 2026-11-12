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
  data/alt_meanings.json   Alternative translations for all 6,236 ayahs
                           (Pickthall + Saheeh International + Muhiuddin Khan)
  data/wbw/*.json          Word-by-word meanings (77,429 words, EN + BN + transliteration)
  data/words_index.json    14,660 distinct Quranic word forms — frequency, refs,
                           trilingual gloss, category (Word Meanings explorer)
  data/tr/{1..114}.json    Ayah-by-ayah translations — 7 editions + transliteration
                           + Bangla pronunciation + footnotes + surah introduction
  data/business.json       147 business & trade entries in 6 sections
  data/more/*.json         Knowledge Hub — 99 names, 70 du'as, 10 guides,
                           61 daily ayahs + 50 hadith, 16 topic collections
  figures/fig_*.jpg        666 figures (pdfimages -png → JPG q78, 109M → 22M)
  pdf/part{1..3}.pdf       original volumes (24M)
tafsir.db[.gz]             SQLite (53M → 12M gz): 7,796 paras (EN+BN), 6,236 ayahs,
                           14,660-form word index, 7 translations per ayah (6,236 rows),
                           ayah notes, surah intros, 347 deep-study words, figures, FTS5
flutter/                   Android app (Flutter + sqflite + just_audio + local notifications)
sw.js / manifest.json      PWA offline (CACHE tafsir-v17, cache-first for jpg/js)
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
- **Related videos, in-page player**: each surah chapter embeds real videos from [NAK Bangla](https://www.youtube.com/@NAKBangla/videos), [Dr Sufyan — Quran Daily Dose](https://www.youtube.com/@qurandailydose2985/videos) and [Xaryab Haschmi Podcast](https://www.youtube.com/@xaryabhaschmiofficial/videos) via a lazy facade player (`assets/js/video.js`) — thumbnail first, no YouTube JS until you press play; mapped in `assets/data/ghaur_ofikr_map.js` (98 curated entries across 48 surahs from three channels, all IDs verified against YouTube oEmbed; `youtube-nocookie.com`, `rel=0`).
- **Ghaur o Fikr & Wikipedia**: `WIKI_MAP` + `GHAUR_O_FIKR_MAP` via `fetchKnowledgeData()`; `alt_meanings.json` now covers all 6,236 ayahs with Pickthall + Saheeh International + Muhiuddin Khan.
- **Word Meanings — complete vocabulary**: `words.html` merges the curated deep-study entries (roots, forms, why-this-word, alternative meanings) with a full frequency index of **14,660 distinct Quranic word forms** from the word-by-word corpus. Search in Arabic, transliteration, English or Bangla; filter by surah/category; every tile shows its frequency (`×2763`) and tapping opens occurrences, root and glosses. Render is paginated (300 tiles at a time) so the full index stays fast.
- **Ayah-by-ayah translations — 7 editions**: every chapter page has a lazy accordion with **Saheeh International (EN)** and six Bangla editions — Islamic Foundation, Taisirul Quran, Al-Bayan, Sheikh Mujibur Rahman, Muhiuddin Khan and Zahurul Haque — plus transliteration, Bangla pronunciation, footnotes (`fn`) and the classical surah introduction. Files are per-surah (`assets/data/tr/N.json`), fetched only when opened. The Flutter reader exposes the same set in a bottom sheet from the `translations` table.
- **Knowledge Hub** (`more.html`): **99 Names of Allah** with meanings and Qur'an references, **70 du'as in 12 categories** (morning/evening, sleep, food, travel, hardship, fasting, Umrah…), **10 step-by-step guides** (wudu, ghusl, salah, fasting, zakat, hajj, Umrah, ruqyah, janazah, marriage), **61 daily ayahs + 50 hadith**, and **16 topic collections** (prayer, patience, mercy, parents, family, rizq, charity, truthfulness, justice, knowledge, character, gratitude, death, Paradise…). Flutter reaches the same content from Read and Settings.
- **Business & Trade — expanded to 147 entries**: 61 Qur'anic cards generated from exact eQuran Arabic/EN/BN, 25 well-attested hadith, 13 Companions' market stories, 24 halal-growth tactics, 12 modern ethics and 12 riba-free finance structures.
- **TTS verse-only**: `tts.js` reads only `.verse` (Quranic rule), per-para 🔊, cloud hook `window.TTS_CLOUD_URL`.
- **Complete tilawah**: 6 reciters × 6,236 ayahs (CDN + `everyayah.com` fallback) and 114 whole-surah files per reciter (`cdn.mp3quran.net`, CORS-enabled), plus 77,429 word pronunciations (`audio.qurancdn.com`). Audio is streamed from free public CDNs, never bundled.
- **Kids & Builder**: `Kids` toggle + daily streak, `builder.js` tadabbur picker (localStorage + URL hash).
- **Vocabulary**: 82-word `vocabulary.html` with categories + 5-word quiz (flashcard).
- **Offline PWA + APK**: `sw.js` **v17** caches all chapters/read pages/assets (incl. the video facade player, translation files and Knowledge Hub data), `manifest.json`; the Flutter app bundles `tafsir.db.gz` (DB v4), the 14,660-form word index and knowledge data. GitHub Releases publish `arm64-v8a`, `armeabi-v7a` and `x86_64` APKs built by `flutter-apk.yml`.

## How it was built

1. `pdftotext -layout` → `paras.json` (7,796 paras) + `pdfimages -png` → 666 figs (JPG q78).
2. `translate` EN→BN via `clients5.google.com/translate_a/t?client=dict-chrome-ex` (SEP ␟, cached `trans_cache.json` 7,796, 3 workers).
3. `gen_site.py` emits 114 overviews + 372 `chapters/N/read/pageX.html` (smart nav) + `vocabulary.html`.
4. `scripts/build_db.py` → `tafsir.db` (VACUUM + gzip, FTS5); `scripts/backfill_arabic_local.py` adds `quran_ayahs` (6,236) + FTS, syncs `alt_meanings` and refreshes the Flutter asset.
5. `scripts/update_research.py --daily` (03:00 UTC, `Daily Research Update` workflow) refreshes `alt_meanings.json` from AlQuran.cloud.
6. `scripts/build_words_index.py` → 14,660-form `words_index.json` (+ gzip for Flutter); `scripts/build_translations.py` → 114 per-surah 7-edition files; `scripts/build_extra_db.py` → `translations`/`ayah_notes`/`surah_intros` tables, DB v4; `scripts/build_business_expanded.py` → 147 business entries; `scripts/build_more_data.py` → Knowledge Hub data. These read the public eQuran dataset (`https://equran.alshahriar.dev/`).
7. `flutter build apk --split-per-abi` in `flutter-apk.yml`, triggered on each GitHub Release.

## Development

```bash
python3 -m http.server 8000                 # static site
python3 scripts/build_wbw.py --check        # validate word-by-word data
python3 scripts/build_audio.py --check      # validate audio manifest
python3 scripts/backfill_arabic_local.py    # rebuild quran_ayahs/alt_meanings + flutter/assets/tafsir.db.gz
python3 scripts/update_research.py --daily  # refresh alt_meanings.json
# content expansion (needs the eQuran dataset in /tmp/opencode/eqdata):
python3 scripts/build_words_index.py
python3 scripts/build_translations.py
python3 scripts/build_extra_db.py
python3 scripts/build_business_expanded.py
python3 scripts/build_more_data.py
cd flutter && flutter pub get && flutter build apk --split-per-abi
```

Notes: the full `build_db.py` pipeline needs `paras.json` / `trans_cache.json` (generated from the PDFs, not committed); day-to-day Arabic/alt-meaning maintenance goes through `backfill_arabic_local.py`, which patches the existing database in place.

## Security & release checks

GitHub Pages cannot send HTTP response headers, so every HTML page carries the
equivalent policy in its `<head>`: a strict `Content-Security-Policy`, a
`strict-origin-when-cross-origin` referrer policy, a permissions policy that
disables camera/microphone/geolocation/payment, and no telephone auto-linking.
`scripts/apply_security_headers.py` injects the block into generated pages and
`scripts/validate_data.py` fails CI if any page is missing it or references an
`http://` asset.

Additional hardening:

- External links get `rel="noopener noreferrer"`; `wiki.js` treats Wikipedia as
  untrusted input (markup stripped, strings escaped, URLs restricted to HTTPS).
- The notes import merges only ayah-keyed primitives, so a crafted backup file
  cannot pollute object prototypes.
- `sw.js` validates notification URLs against its own origin before opening.
- Flutter releases are HTTPS-only (`network_security_config.xml`), have cloud
  backup/device transfer disabled, request only INTERNET / notifications /
  exact-alarm permissions, and never embed credentials. The APK workflow rejects
  debug-signed output and verifies the zip alignment and Pigeon/JNI signatures.
- Every GitHub Actions `uses:` is pinned to a full commit SHA; workflow
  permissions are read-only unless publishing a release.

All builds and checks run in GitHub Actions — the web bundle through **Web CI**
(`scripts/validate_data.py`, JSON/JS/Python syntax, Playwright browser smoke
tests) and the APK through **Flutter APK** on a release. Nothing needs a local
Android SDK.

## License

Content: the original book is freely shareable per the author's notice. Bengali translation: machine-generated for convenience. Code: MIT.
