/* Knowledge pills — folds book-extract translations into a single button after
 * an ayah or after a word. Unfolds into a rounded popover whose size follows the
 * number of available translations. Data: assets/data/knowledge.json (book
 * extracts) + assets/data/quran_ar.json (ayah text), both fetched lazily. */
(function () {
  const KB_URL = relAsset("assets/data/knowledge.json");
  const AR_URL = relAsset("assets/data/quran_ar.json");

  function relAsset(p) {
    const path = location.pathname;
    if (path.includes("/read/")) return "../../" + p;
    if (/\/chapters\//.test(path)) return "../" + p;
    return p;
  }

  const AR_DIACRITICS = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g;
  function normAr(s) {
    return String(s || "").replace("\ufeff", "").replace(AR_DIACRITICS, "")
      .replace(/\u0671/g, "\u0627").replace(/\u0622|\u0623|\u0625/g, "\u0627")
      .replace(/\u0649/g, "\u064a").replace(/\u0629/g, "\u0647").trim();
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[<>&"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" }[c]));
  }

  const state = { kb: null, ar: null, kbP: null, arP: null };
  function loadKB() {
    if (!state.kbP) state.kbP = fetch(KB_URL).then((r) => (r.ok ? r.json() : {})).catch(() => ({}))
      .then((kb) => { state.kb = kb; return kb; });
    return state.kbP;
  }
  function loadAr() {
    if (!state.arP) state.arP = fetch(AR_URL).then((r) => (r.ok ? r.json() : {})).catch(() => ({}));
    return state.arP;
  }
  function arText(surah, ayah) {
    if (!state.ar || !state.ar[surah]) return "";
    return (state.ar[surah][ayah] || "").replace("\ufeff", "");
  }

  function extractCard(r) {
    const title = r.title ? `<div class="kbc-title">${esc(r.title)}</div>` : "";
    const ar = r.ar ? `<div class="kbc-ar arabic-text">${esc(r.ar)}</div>` : "";
    const en = r.en ? `<div class="kbc-en">${esc(r.en)}</div>` : "";
    const bn = r.bn ? `<div class="kbc-bn bn-text">${esc(r.bn)}</div>` : "";
    const src = r.src ? `<div class="kbc-src">${esc(r.src)}</div>` : "";
    return `<div class="kb-card glass">${title}${ar}${en}${bn}${src}</div>`;
  }

  function popBody(items, ayahBlocks) {
    const ars = (ayahBlocks || []).map((b) =>
      `<div class="kb-ayah"><span class="kb-ayah-ref">${esc(b.ref)}</span><span class="arabic-text">${esc(b.ar)}</span></div>`).join("");
    const cards = (items || []).map(extractCard).join("");
    if (!ars && !cards) return `<div class="kb-empty">No additional translations yet.</div>`;
    return ars + cards;
  }

  // Build the folded pill. items = array of knowledge records.
  function pill(opts) {
    const items = opts.items || [];
    const ars = opts.ayahs || []; // [{ref, ar}]
    if (!items.length && !ars.length) return "";
    const n = items.length + ars.length;
    const label = opts.label || `${n} ${opts.unit || "extract"}${n === 1 ? "" : "s"}`;
    const key = opts.key || "";
    return `<div class="kb-pill" data-key="${esc(key)}">
      <button class="kb-toggle" type="button" aria-expanded="false" aria-label="Show translations">
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
        <span>${esc(label)}</span>
        <svg class="kb-caret" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
      </button>
      <div class="kb-pop" role="region" hidden data-rendered="0"></div>
    </div>`;
  }

  function ayahPillHTML(surah, ayahList, opts) {
    const kb = (state.kb && state.kb.byAyah) || {};
    const items = [];
    let count = 0;
    (ayahList || []).forEach((a) => {
      const ref = `${surah}:${a}`;
      (kb[ref] || []).forEach((r) => items.push(r));
      if (arText(surah, a)) count++;
    });
    const ars = (ayahList || []).map((a) => ({ ref: `${surah}:${a}`, ar: arText(surah, a) })).filter((b) => b.ar);
    if (!items.length && !ars.length) return "";
    return pill(Object.assign({ items, key: `a${surah}:${(ayahList || []).join(",")}` }, opts, { ayahs: ars }));
  }

  function wordPillHTML(word, opts) {
    const kb = (state.kb && state.kb.byWord) || {};
    const items = kb[normAr(word)] || [];
    if (!items.length) return "";
    return pill(Object.assign({ items, key: `w${normAr(word)}`, unit: "translation" }, opts));
  }

  // Render pop content on demand, fetching Arabic lazily.
  function renderPop(pillEl) {
    const pop = pillEl.querySelector(".kb-pop");
    if (!pop || pop.dataset.rendered === "1") return;
    loadAr().then((ar) => {
      state.ar = ar;
      const key = pillEl.dataset.key || "";
      let ars = [], items = [];
      if (key.startsWith("a") && state.kb) {
        const spec = key.slice(1).split(":");
        const surah = spec[0], list = spec[1].split(",");
        ars = list.map((a) => ({ ref: `${surah}:${a}`, ar: arText(surah, a) })).filter((b) => b.ar);
        const kb = state.kb.byAyah || {};
        list.forEach((a) => (kb[`${surah}:${a}`] || []).forEach((r) => items.push(r)));
      } else if (key.startsWith("w") && state.kb) {
        items = (state.kb.byWord || {})[key.slice(1)] || [];
      }
      pop.innerHTML = popBody(items, ars);
      pop.dataset.rendered = "1";
    });
  }

  function bindDelegation() {
    document.addEventListener("click", (e) => {
      const btn = e.target.closest(".kb-toggle");
      if (btn) {
        const pillEl = btn.closest(".kb-pill");
        const open = pillEl.classList.toggle("open");
        btn.setAttribute("aria-expanded", open ? "true" : "false");
        const pop = pillEl.querySelector(".kb-pop");
        if (open) { renderPop(pillEl); pop.hidden = false; }
        else pop.hidden = true;
        return;
      }
      if (!e.target.closest(".kb-pill")) {
        document.querySelectorAll(".kb-pill.open").forEach((p) => {
          p.classList.remove("open");
          p.querySelector(".kb-toggle")?.setAttribute("aria-expanded", "false");
          const pop = p.querySelector(".kb-pop"); if (pop) pop.hidden = true;
        });
      }
    });
  }

  // Inject pills after ayah paragraphs on reading pages and after quote blocks on overview pages.
  function injectIntoPage(surah) {
    if (!surah) return;
    let changed = false;

    // reading pages: paragraphs of verses, may contain several [n] markers
    document.querySelectorAll(".ch-body .verse.c-en").forEach((p) => {
      if (p.nextElementSibling && p.nextElementSibling.classList.contains("kb-pill")) return;
      const nums = (p.textContent.match(/\[(\d+)\]/g) || []).map((s) => s.replace(/[\[\]]/g, ""));
      if (!nums.length) return;
      const html = ayahPillHTML(surah, nums, { label: `Ayah ${nums[0]}${nums.length > 1 ? "–" + nums[nums.length - 1] : ""}` });
      if (html) { p.insertAdjacentHTML("afterend", html); changed = true; }
    });

    // overview pages: quotes that cite an ayah, e.g. [Al Quran 2:255]
    document.querySelectorAll(".quote.c-en").forEach((q) => {
      if (q.nextElementSibling && q.nextElementSibling.classList.contains("kb-pill")) return;
      const m = q.textContent.match(/(?:Al[\s-]?Qur'?an|Quran|আল কুরআন)\s*(\d{1,3})\s*[:.]\s*(\d{1,3})/i)
        || q.textContent.match(/\[(\d{1,3})\s*:\s*(\d{1,3})\]/);
      if (!m) return;
      const s = parseInt(m[1], 10), a = parseInt(m[2], 10);
      if (!(s >= 1 && s <= 114)) return;
      const html = ayahPillHTML(s, [String(a)], { label: `Ayah ${s}:${a}` });
      if (html) { q.insertAdjacentHTML("afterend", html); changed = true; }
    });
    return changed;
  }

  function currentSurah() {
    const m = location.pathname.match(/chapters\/(\d+)(?:\/read\/page\d+\.html)?/);
    if (location.pathname.match(/chapters\/\d+\.html/) || location.pathname.includes("/read/")) return m ? parseInt(m[1], 10) : null;
    return m ? parseInt(m[1], 10) : null;
  }

  function boot() {
    bindDelegation();
    const isReading = !!(document.querySelector(".ch-body") || document.querySelector(".quote"));
    if (!isReading) { loadKB(); return; }
    Promise.all([loadKB(), loadAr()]).then(([kb, ar]) => {
      state.kb = kb; state.ar = ar;
      const s = currentSurah();
      try { injectIntoPage(s); } catch (e) { console.error("knowledge", e); }
    });
  }

  window.TafsirKnowledge = { pill, ayahPillHTML, wordPillHTML, normAr, esc, loadKB, loadAr, reload: boot };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
