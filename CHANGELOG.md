# Changelog

## 2.7.0 — 2026-11-12

Production/security hardening release.

### Web

- Content-Security-Policy, referrer and permissions policies injected into all
  614 HTML documents (GitHub Pages cannot send response headers).
- Fixed duplicated `chapters.js` / `app.js` / `tts.js` tags on all 372 read
  pages; the second copy threw `Identifier 'QURAN' has already been declared`
  and could break TTS and late listeners.
- Wikipedia content is now treated as untrusted: markup stripped, strings
  escaped, links restricted to HTTPS.
- Ayah footnotes/surah introductions pass through an allow-list sanitizer.
- Notes/highlight import merges only ayah-keyed primitives (no prototype
  pollution).
- External links receive `rel="noopener noreferrer"`; service worker
  validates notification URLs against its origin.
- New `manifest.json` (relative scope, shortcuts, categories), `sitemap.xml`
  (497 URLs), `robots.txt`, `SECURITY.md` and `.well-known/security.txt`.

### Android (Flutter)

- Release build requires a real signing key; CI rejects debug-signed APKs and
  verifies zip alignment plus Pigeon/JNI signatures.
- HTTPS-only network security config, backups/device transfer disabled,
  minimal permissions (INTERNET, notifications, boot), `<queries>` for external
  HTTPS intents.
- https URL validation for all audio streams; YouTube links open in the system
  browser instead of only being copied.
- Global error handlers render a friendly retry screen instead of a raw
  framework error.
- Bundled-data tests cover the 14.6k word index, Knowledge Hub counts, business
  entries, DB v4 tables, all 114 word-by-word files and the audio manifest.

### CI

- New **Web CI**: data validation, Python/JS/JSON syntax checks, Playwright
  smoke test (word explorer, Knowledge Hub, business, chapter translations,
  dark theme, assets).
- All third-party actions pinned to full commit SHAs; `contents: read` by
  default; concurrency and timeouts on both workflows.
- `scripts/validate_data.py` is the single gate for counts, asset parity, CSP,
  service-worker manifest and workflow pinning.

## 2.6.0

- 14,660-form word index, 7 translation editions for all 114 surahs,
  Knowledge Hub (99 names, 70 du'as, 10 guides, daily ayah/hadith, 16 topics),
  147 business entries, DB v4, service-worker cache `tafsir-v17`.
