/* Word Meanings explorer — categorized trilingual glossary from tafsir.db.
 * Root -> ayah references, exact Arabic matching, alternative meanings and
 * book extracts (knowledge pills). */
(function () {
  let WORDS = [];
  let filtered = [];
  let favee = new Set(JSON.parse(localStorage.getItem("tafsir-fav") || "[]"));
  let current = null;

  const CAT_LABEL = {
    business: "Business", mercy: "Mercy", prayer: "Prayer", justice: "Justice",
    knowledge: "Knowledge", patience: "Patience", creation: "Creation",
    afterlife: "Afterlife", family: "Family", prophets: "Prophets", faith: "Faith",
    language: "Language", general: "General", pending: "Pending research",
  };

  function esc(s) { return String(s == null ? "" : s).replace(/[<>&"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" }[c])); }
  function isPlaceholder(w) { return !w || /^كلمة\d+/.test(w); }
  function normAr(s) { return (window.TafsirKnowledge && TafsirKnowledge.normAr) ? TafsirKnowledge.normAr(s) : String(s || "").trim(); }
  function isArabic(s) { return /[\u0600-\u06FF]/.test(s || ""); }

  function initSurahFilter() {
    const sel = document.getElementById("surahFilter");
    if (!sel) return;
    let opts = '<option value="0">All surahs</option>';
    const chapters = (window.CHAPTERS && (window.CHAPTERS.chapters || window.CHAPTERS)) || [];
    const names = {};
    (Array.isArray(chapters) ? chapters : Object.values(chapters)).forEach((c) => { if (c && c.n) names[c.n] = c; });
    for (let n = 1; n <= 114; n++) {
      const c = names[n] || { ar: "سورة " + n, en: "Surah " + n };
      opts += `<option value="${n}">${n}. ${esc(c.en || "")} — ${esc(c.ar || "")}</option>`;
    }
    sel.innerHTML = opts;
  }

  function initCategoryFilter() {
    const sel = document.getElementById("catFilter");
    if (!sel) return;
    const counts = {};
    WORDS.forEach((x) => { counts[x.cat] = (counts[x.cat] || 0) + 1; });
    const order = ["business", "mercy", "prayer", "justice", "knowledge", "patience",
      "creation", "afterlife", "family", "prophets", "faith", "language", "general"];
    let opts = '<option value="">All categories</option>';
    order.forEach((c) => {
      if (!counts[c]) return;
      opts += `<option value="${c}">${esc(CAT_LABEL[c] || c)} (${counts[c]})</option>`;
    });
    sel.innerHTML = opts;
  }

  function wordChips(x) {
    let chips = "";
    if (x.cat && x.cat !== "pending") chips += `<span class="w-chip gold">${esc(CAT_LABEL[x.cat] || x.cat)}</span>`;
    if (x.root) chips += `<span class="w-chip">${esc(x.root)}</span>`;
    if (x.am && x.am.length) chips += `<span class="w-chip">${x.am.length} ${x.am.length === 1 ? "meaning" : "meanings"}</span>`;
    if (isPlaceholder(x.w)) chips += `<span class="w-chip">data pending</span>`;
    return chips;
  }

  function refChip(x) {
    if (!x.ref) return "";
    const s = String(x.ref).split(":")[0];
    return `<a class="w-chip ref" href="chapters/${encodeURIComponent(s)}.html" onclick="event.stopPropagation()">${esc(x.ref)}</a>`;
  }

  function tile(x, i) {
    const fav = favee.has(x.id);
    return `<article class="word-tile glass ${fav ? "fav" : ""} ${isPlaceholder(x.w) ? "placeholder" : ""}" data-i="${i}" tabindex="0" role="button" aria-label="Open details for ${esc(x.tr || x.en || x.w)}">
      <div class="w-ar">${esc(x.w)}</div>
      <div class="w-tr">${esc(x.tr || "")}</div>
      <div class="w-en">${esc(x.en || "")}</div>
      <div class="w-bn bn-text">${esc(x.bn || "")}</div>
      <div class="w-foot">${wordChips(x)}${refChip(x)}</div>
    </article>`;
  }

  function meanBlock(m) {
    if (!m) return "";
    if (typeof m === "string") return `<div class="info-block glass-gold">${esc(m)}</div>`;
    const src = m.source ? `<div class="mean-src">${esc(m.source)}</div>` : "";
    const mean = m.meaning ? `<div>${esc(m.meaning)}</div>` : "";
    const ev = m.evidence ? `<div class="mean-ev">${esc(m.evidence)}</div>` : "";
    return `<div class="info-block glass-gold">${mean}${ev}${src}</div>`;
  }

  function knowledgePill(x) {
    if (!window.TafsirKnowledge) return "";
    try {
      const ref = x.ref ? String(x.ref).match(/(\d{1,3}):(\d{1,3})/) : null;
      const ayahPill = ref ? TafsirKnowledge.ayahPillHTML(parseInt(ref[1], 10), [ref[2]], { label: `Ayah ${ref[1]}:${ref[2]}` }) : "";
      const wordPill = TafsirKnowledge.wordPillHTML(x.w, { label: "Word translations" });
      return `<div class="kb-row">${ayahPill}${wordPill}</div>`;
    } catch (e) { return ""; }
  }

  function renderSheet(x) {
    const alts = Array.isArray(x.am) ? x.am : [];
    return `
      <button class="sheet-close" id="sheetClose" aria-label="Close">✕</button>
      <div class="ar-big">${esc(x.w)}</div>
      <div class="tr-mid">${esc(x.tr || "")}</div>
      ${x.cat && x.cat !== "pending" ? `<div style="text-align:center;margin-top:6px"><span class="w-chip gold">${esc(CAT_LABEL[x.cat] || x.cat)}</span></div>` : ""}
      <div class="sheet-actions">
        <button class="btn ghost" onclick="window._wordTTS('${esc(x.w).replace(/'/g, "")}')" title="Listen in Arabic">🔊 Arabic</button>
        <a class="btn ghost" href="chapters/${x.surah}.html">Surah ${x.surah} tafsir →</a>
      </div>
      ${knowledgePill(x)}
      ${x.en ? `<div class="sec-title">Meaning</div><div class="info-block">${esc(x.en)}</div>` : ""}
      ${x.bn ? `<div class="sec-title bn-text">অর্থ (বাংলা)</div><div class="info-block bn-text">${esc(x.bn)}</div>` : ""}
      ${x.root ? `<div class="sec-title">Root · ${(x.root).split("-").join(" ")}</div><div class="info-block glass-gold"><b>${esc(x.root)}</b>${x.root_analysis_text ? `<div style="margin-top:4px">${esc(x.root_analysis_text)}</div>` : ""}</div>` : ""}
      ${x.form ? `<div class="sec-title">Linguistic form</div><div class="info-block">${esc(x.form)}</div>` : ""}
      ${x.why ? `<div class="sec-title">Why this word (Ayn)</div><div class="info-block glass-gold">${esc(x.why)}</div>` : ""}
      ${alts.length ? `<div class="sec-title">Alternative meanings — ${alts.length} ${alts.length === 1 ? "view" : "views"}</div>${alts.map(meanBlock).join("")}` : ""}
    `;
  }

  function openSheet(i) {
    current = filtered[i];
    if (!current) return;
    const s = document.createElement("div");
    s.className = "word-sheet"; s.id = "wordSheet";
    s.innerHTML = `<div class="sheet">${renderSheet(current)}</div>`;
    s.addEventListener("click", (e) => { if (e.target === s) closeSheet(); });
    document.body.appendChild(s);
    document.body.style.overflow = "hidden";
    const c = document.getElementById("sheetClose");
    if (c) c.addEventListener("click", closeSheet);
  }
  function closeSheet() {
    document.getElementById("wordSheet")?.remove();
    document.body.style.overflow = "";
  }
  window._wordTTS = function (text) {
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "ar-SA"; u.rate = .78;
      window.speechSynthesis.speak(u);
    } catch (e) {}
  };

  function matches(x, q) {
    if (!q) return true;
    if (isArabic(q)) {
      const nq = normAr(q);
      if (!nq) return true;
      return x.ar_norm === nq || x.ar_norm.includes(nq) || (x.root || "").replace(/-/g, "").includes(nq);
    }
    return (x.srch || "").includes(q);
  }

  function apply() {
    const q = (document.getElementById("wSearch")?.value || "").trim().toLowerCase();
    const sn = parseInt(document.getElementById("surahFilter")?.value || "0", 10);
    const cat = document.getElementById("catFilter")?.value || "";
    const favOnly = document.getElementById("favOnly")?.checked;
    filtered = WORDS.filter((x) => {
      if (isPlaceholder(x.w) && (q || !cat)) return false;
      if (sn && x.surah !== sn) return false;
      if (cat && x.cat !== cat) return false;
      if (favOnly && !favee.has(x.id)) return false;
      return matches(x, q);
    });
    // group visually: business first, then alphabetical by category label
    const grid = document.getElementById("wordGrid");
    grid.innerHTML = filtered.map(tile).join("");
    grid.hidden = filtered.length === 0;
    document.getElementById("wEmpty").hidden = filtered.length !== 0;
    const shown = WORDS.filter((x) => x.cat !== "pending" && !isPlaceholder(x.w)).length;
    document.getElementById("wCount").textContent = q || cat || sn
      ? `${filtered.length} of ${WORDS.length} words`
      : `${shown} study words`;
    grid.querySelectorAll(".word-tile").forEach((t) => {
      const i = parseInt(t.dataset.i, 10);
      t.addEventListener("click", () => openSheet(i));
      t.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openSheet(i); } });
    });
  }

  function boot(data) {
    data.forEach((x, idx) => {
      x.id = idx + 1;
      if (x.ra && typeof x.ra === "object") {
        const parts = [x.ra.pattern, x.ra.bayyinah_note].filter(Boolean);
        x.root_analysis_text = x.root_analysis_text || parts.join(" · ");
      }
      if (!x.ar_norm) x.ar_norm = normAr(x.w);
      if (!x.srch) x.srch = [x.w, x.tr, x.en, x.bn, x.root, x.form, x.why].join(" ").toLowerCase();
      if (!x.cat) x.cat = "general";
    });
    WORDS = data;
    document.getElementById("wLoading").hidden = true;
    initSurahFilter();
    initCategoryFilter();
    apply();
    document.getElementById("wSearch")?.addEventListener("input", apply);
    document.getElementById("surahFilter")?.addEventListener("change", apply);
    document.getElementById("catFilter")?.addEventListener("change", apply);
    document.getElementById("favOnly")?.addEventListener("change", apply);
  }

  document.addEventListener("DOMContentLoaded", () => {
    const ready = window.TafsirKnowledge ? TafsirKnowledge.loadKB() : Promise.resolve();
    Promise.all([fetch("assets/data/words_export.json").then((r) => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); }), ready])
      .then(([words]) => boot(words))
      .catch(() => {
        const el = document.getElementById("wLoading");
        if (el) el.textContent = "Word data could not load — check your connection and reload.";
      });
  });
})();
