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
