# Adding Knowledge — Related Videos & Bayyinah Guide

This project consolidates local JSON, WIKI_MAP and curated videos from both YouTube channels, plus Bayyinah via `fetchKnowledgeData(surahNumber)` in `assets/js/wiki.js`.

## 1. Related Videos — NAK Bangla & Dr Sufyan (YouTube)

**File:** `assets/data/ghaur_ofikr_map.js` — `const GHAUR_O_FIKR_MAP = { 2: [...] }` (legacy name kept; the map now holds curated, real videos from both channels)

**Channels:**
- [NAK Bangla — নোমান আলী খান](https://www.youtube.com/@NAKBangla/videos) (`channel: "nak"`) — Bangla dars, Bayyinah-style breakdowns
- [Dr Sufyan — Quran Daily Dose](https://www.youtube.com/@qurandailydose2985/videos) (`channel: "qdd"`) — Quran & Modern Science / Ghaur o Fikr (Urdu · English)

**Schema:**
```js
GHAUR_O_FIKR_MAP[surahNumber] = [
  {
    ayah: "2:255",       // or "2:29-31"
    title: "আয়াতুল কুরসির লুকানো নকশা", // exact title as published on the channel
    youtubeId: "IMzP_NAPlt0", // YouTube video ID (from URL ?v=ID)
    timestamp: 0,            // seconds, optional
    topic: "Ayatul Kursi — the hidden design", // for the Science tab matching
    channel: "nak"          // "nak" | "qdd"
  }
]
```

**To add:**
1. Find the video on [NAK Bangla](https://www.youtube.com/@NAKBangla/videos) or [Dr Sufyan — Quran Daily Dose](https://www.youtube.com/@qurandailydose2985/videos) — copy URL `https://www.youtube.com/watch?v=VIDEO_ID&t=123s`
2. Extract `VIDEO_ID` and `t` (timestamp)
3. Verify the ID resolves: `curl -s -o /dev/null -w "%{http_code}" "https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=VIDEO_ID&format=json"` → must be `200`
4. Add entry to `GHAUR_O_FIKR_MAP[surahNumber]` array
5. Commit and push — no rebuild needed (JS loads at runtime; `VT` in `assets/js/video.js` renders the lazy facade, iframe only on click). If you add a new surah key, it will auto-appear in `Science References` and the standalone `Watch — Related Videos` accordion.

Surahs without curated matches show channel links — **never** placeholder video IDs.

## 2. Bayyinah (Nouman Ali Khan — Root Analysis)

**File:** `assets/data/deep_research.js` — `DEEP_RESEARCH[surah].wordByWord[]`

**Schema (per word):**
```js
{
  w: "ٱلرَّحْمَٰنِ", // Arabic
  tr: "Ar-Rahman", // transliteration
  root: "ر-ح-م",
  form: "fa'lan (intensive)",
  why: "Fa'lan = overflowing, immediate (dunya) vs fa'eel = permanent (akhirah)",
  en: "The Entirely Merciful — mercy that is vast and immediate",
  bn: "পরম করুণাময় — বিশাল ও তাৎক্ষণিক দয়া",
  // NEW Bayyinah fields:
  root_analysis: {
    root: "ر-ح-م",
    pattern: "fa'lan",
    corpus_ref: "https://corpus.quran.com/wordbyword.jsp?chapter=1&verse=1#1:1",
    bayyinah_note: "Bayyinah: Ar-Rahman vs Ar-Rahim — fa'lan (temporary, vast) vs fa'eel (permanent). See Divine Speech."
  },
  alternative_meanings: [
    {source: "Bayyinah / Nouman Ali Khan", meaning: "Linguistic: ...", evidence: "Divine Speech"},
    {source: "Corpus Quran", meaning: "Morphology: ...", evidence: "corpus.quran.com"},
    {source: "Scientific Tafsir", meaning: "...", evidence: "Zakaria Kamal"}
  ]
}
```

**To add:**
1. Use [Bayyinah App](https://bayyinah.com) or `Divine Speech` book, or [Quranic Arabic Corpus](https://corpus.quran.com) for `root`, `pattern`, `corpus_ref`
2. Add `root_analysis` and `alternative_meanings` to the word's entry in `deep_research.js`
3. The `Word-by-Word` accordion will automatically render them as `Bayyinah Root Analysis` + `Alternative Meanings` list (with fallback `No additional linguistic analysis available` if missing, via `deep.wordByWord` length check)

## 3. Data Pipeline (fetchKnowledgeData)

**Location:** `assets/js/wiki.js` — `async function fetchKnowledgeData(surahNumber)`

```js
async function fetchKnowledgeData(n){
  return {
    wiki: await fetchWiki(WIKI_MAP.surah[n]),
    deep: DEEP_RESEARCH[n],
    know: SURAH_KNOWLEDGE[n],
    ghaur: GHAUR_O_FIKR_MAP[n] || [],
    bayyinah: DEEP_RESEARCH[n].wordByWord.filter(w=>w.root_analysis).map(...)
  };
}
```

- Consolidates `local JSON` + `WIKI_MAP` + `GHAUR_O_FIKR_MAP` + `Bayyinah` fields + `corpus.quran.com` refs
- Handles missing gracefully: `if(!deep || !deep.wordByWord) show "No additional linguistic analysis available"`
- Called on `DOMContentLoaded` for current `chapters/N.html` and on `builder` interaction

## 4. UI

- **Watch — Related Videos:** `Watch — Related Videos (NAK Bangla · Dr. Sufyan)` accordion renders real YouTube videos (thumbnail + play, `youtube-nocookie.com` iframe on click via `assets/js/video.js`) matched to the surah from `GHAUR_O_FIKR_MAP`; same videos also appear under `Science References`. Surahs without curated matches show channel links — no placeholder videos.
- **Word-by-Word:** Each `wbw-card` now shows `Bayyinah Root Analysis` (with Corpus link) + `Alternative Meanings` list
- All accordions use premium SVG (no emoji), skeletons while loading, and `Reload` → `fetchKnowledgeData(n)` (not just `location.reload()`)

**To test:** Open `chapters/112.html`, expand `Watch — Related Videos` → should show 4 clickable video facades; clicking one embeds the YouTube player inline. `chapters/2.html` shows 8.

## 5. Complete word index (14,660 forms)

**File:** `assets/data/words_index.json` (web) and `flutter/assets/words_index.json.gz`
**Generator:** `python3 scripts/build_words_index.py`

Aggregates `assets/data/wbw/*.json` into one entry per normalized Arabic form:

```json
{"w":"ٱلْحَمْدُ","tr":"al-ḥamdu","en":"All praises","bn":"সকল প্রশংসা",
 "n":5,"s":1,"a":2,"ref":"1:2","refs":["1:2","6:1"],
 "ar_norm":"الحمد","cat":"prayer","srch":"..."}
```

`n` is the frequency, `refs` the first occurrences, `cat` a topical category inferred from the gloss. `words.js` merges this index with the curated deep-study entries from `words_export.json` (curated entries win, so roots/forms/why-notes are never lost) and paginates the grid at 300 tiles. Flutter does the same merge in `words_screen.dart` and shows the frequency chip.

## 6. Ayah-by-ayah translations (7 editions)

**Files:** `assets/data/tr/{1..114}.json`
**Generator:** `python3 scripts/build_translations.py --src /tmp/opencode/eqdata`

Each file:

```json
{"s":2,"sources":[{"id":"en","name":"Saheeh International"}, ...],
 "intro":"<b>...</b>","fu":{"arabic phrase":"bangla pronunciation"},
 "ayahs":[{"a":1,"ar":"...","en":"...","bq":"...","taisir":"...","bayan":"...",
           "mujib":"...","khan":"...","hoque":"...","tr":"...","uc":"...",
           "fn":{"1":"footnote"}}]}
```

Editions: `en` Saheeh International · `bq` Islamic Foundation Bangladesh · `taisir` Taisirul Quran · `bayan` Al-Bayan · `mujib` Sheikh Mujibur Rahman · `khan` Muhiuddin Khan · `hoque` Zahurul Haque.

Web: `assets/js/translations.js` is included on every `chapters/N.html` and builds a `<details>` accordion that lazy-fetches `../assets/data/tr/N.json` on first open, with a source switcher. Flutter: `TafsirDb.i.translations(surah)` / `ayahNotes(surah)` from the `translations` / `ayah_notes` tables, shown in the reader's `_TranslationsSheet`.

After changing translation sources, run:

```bash
python3 scripts/build_translations.py
python3 scripts/build_extra_db.py   # fills translations/ayah_notes/surah_intros + repacks the Flutter DB
```

## 7. Knowledge Hub data

**Files:** `assets/data/more/{names,duas,learn,daily,topics}.json` (+ Flutter copies)
**Generator:** `python3 scripts/build_more_data.py`

| File | Contents |
|------|----------|
| `names.json` | 99 names — Arabic, transliteration, English + Bangla meaning, description, Qur'an refs |
| `duas.json` | 12 categories / 70 du'as — Arabic, pronunciation, Bangla, source |
| `learn.json` | 10 step-by-step guides — intro, ordered steps with Arabic/pronunciation/source |
| `daily.json` | 61 daily ayahs + 50 hadith |
| `topics.json` | 16 topic collections (prayer, patience, mercy, parents, family, rizq, charity, truthfulness, justice, knowledge, character, gratitude, death, Paradise…) |

Web UI: `more.html` + `assets/js/more.js` (tabs + search + topic drill-down). Flutter: `flutter/lib/screens/more_screen.dart`, opened from Read and Settings. No 7th bottom-nav destination is added.

## 8. Business & Trade (147 entries)

**Generator:** `python3 scripts/build_business_expanded.py`

Sections and counts: `quran` 61 (generated from exact eQuran Arabic/EN/BN), `hadith` 25, `sahaba` 13, `growth` 24, `ethics` 12, `finance` 12. Existing section/item ids are preserved; the script rewrites both `assets/data/business.json` and `flutter/assets/business.json`.

## 9. Database versioning

`flutter/lib/db.dart` uses `kVersion` (currently **4**). Bump it whenever the bundled `tafsir.db.gz` schema or content changes so existing installs re-unpack the asset. Repack with:

```bash
gzip -9 -c tafsir.db > flutter/assets/tafsir.db.gz
```

Web cache: bump `CACHE` in `sw.js` (currently `tafsir-v17`) and add any new HTML/JS/JSON files to `ASSETS`.

## 10. Validation checklist (run before every release)

```bash
python3 scripts/validate_data.py        # counts, parity, CSP, sw.js assets, action pins
python3 -m py_compile scripts/*.py tests/*.py
find assets/js -name '*.js' -print0 | xargs -0 -n1 node --check
cd flutter && flutter analyze --no-fatal-infos && flutter test
```

`validate_data.py` must be green before tagging a release; **Web CI** runs it on
every push along with a Playwright smoke test of the word explorer, Knowledge
Hub, business page, chapter translations and dark theme.

If paginated read pages are regenerated, run
`python3 scripts/normalize_read_pages.py` afterwards so each page loads
`chapters.js`, `app.js` and `tts.js` exactly once.
