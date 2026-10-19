/* Word Meanings explorer — 347 words from tafsir.db (SQLite) with alternative meanings, roots & evidence */
(function(){
  let WORDS = [];
  let filtered = [];
  let favee = new Set(JSON.parse(localStorage.getItem("tafsir-fav") || "[]"));
  let current = null;

  function esc(s){ return String(s==null?"":s).replace(/[<>&"]/g, c=>({"<":"&lt;",">":"&gt;","&":"&amp;",'"':"&quot;"}[c])); }
  function isPlaceholder(w){ return !w || /^كلمة\d+/.test(w); }

  function initSurahFilter(){
    const sel = document.getElementById("surahFilter");
    if(!sel) return;
    let opts = '<option value="0">All surahs</option>';
    const chapters = (window.CHAPTERS && (window.CHAPTERS.chapters || window.CHAPTERS)) || [];
    const names = {};
    (Array.isArray(chapters) ? chapters : Object.values(chapters)).forEach(c=>{ if(c && c.n) names[c.n]=c; });
    for(let n=1; n<=114; n++){
      const c = names[n] || {ar:"سورة "+n, en:"Surah "+n};
      opts += `<option value="${n}">${n}. ${esc(c.en||"")} — ${esc(c.ar||"")}</option>`;
    }
    sel.innerHTML = opts;
  }

  function wordChips(x){
    let chips = "";
    if(x.root) chips += `<span class="w-chip gold">${esc(x.root)}</span>`;
    if(x.form) chips += `<span class="w-chip">${esc(x.form)}</span>`;
    if(x.am && x.am.length) chips += `<span class="w-chip">${x.am.length} ${x.am.length===1?"meaning":"meanings"}</span>`;
    if(isPlaceholder(x.w)) chips += `<span class="w-chip">data pending</span>`;
    return chips;
  }

  function tile(x, i){
    const fav = favee.has(x.id);
    return `<article class="word-tile glass ${fav?"fav":""} ${isPlaceholder(x.w)?"placeholder":""}" data-i="${i}" tabindex="0" role="button" aria-label="Open details for ${esc(x.tr||x.en||x.w)}">
      <div class="w-ar">${esc(x.w)}</div>
      <div class="w-tr">${esc(x.tr||"")}</div>
      <div class="w-en">${esc(x.en||"")}</div>
      <div class="w-bn bn-text">${esc(x.bn||"")}</div>
      <div class="w-foot">${wordChips(x)}</div>
    </article>`;
  }

  function meanBlock(m){
    if(!m) return "";
    if(typeof m === "string") return `<div class="info-block glass-gold">${esc(m)}</div>`;
    const src = m.source ? `<div class="mean-src">${esc(m.source)}</div>` : "";
    const mean = m.meaning ? `<div>${esc(m.meaning)}</div>` : "";
    const ev = m.evidence ? `<div class="mean-ev">${esc(m.evidence)}</div>` : "";
    return `<div class="info-block glass-gold">${mean}${ev}${src}</div>`;
  }

  function renderSheet(x){
    const alts = Array.isArray(x.am) ? x.am : [];
    const ra = typeof x.ra === "string" ? x.ra : (x.ra ? JSON.stringify(x.ra, null, 1) : "");
    return `
      <button class="sheet-close" id="sheetClose" aria-label="Close">✕</button>
      <div class="ar-big">${esc(x.w)}</div>
      <div class="tr-mid">${esc(x.tr||"")}</div>
      <div class="sheet-actions">
        <button class="btn ghost" onclick="window._wordTTS('${esc(x.w).replace(/'/g,"")}')" title="Listen in Arabic">🔊 Arabic</button>
        <a class="btn ghost" href="chapters/${x.surah}.html">Surah ${x.surah} tafsir →</a>
      </div>
      ${x.en ? `<div class="sec-title">Meaning</div><div class="info-block">${esc(x.en)}</div>` : ""}
      ${x.bn ? `<div class="sec-title bn-text">অর্থ (বাংলা)</div><div class="info-block bn-text">${esc(x.bn)}</div>` : ""}
      ${x.root ? `<div class="sec-title">Root · ${(x.root).split("-").join(" ")}</div><div class="info-block glass-gold"><b>${esc(x.root)}</b>${x.root_analysis_text?`<div style="margin-top:4px">${esc(x.root_analysis_text)}</div>`:""}</div>` : ""}
      ${ra ? `<div class="sec-title">Root analysis</div><div class="info-block">${esc(ra)}</div>` : ""}
      ${x.form ? `<div class="sec-title">Linguistic form</div><div class="info-block">${esc(x.form)}</div>` : ""}
      ${x.why ? `<div class="sec-title">Why this word (Ayn)</div><div class="info-block glass-gold">${esc(x.why)}</div>` : ""}
      ${alts.length ? `<div class="sec-title">Alternative meanings — ${alts.length} ${alts.length===1?"view":"views"}</div>${alts.map(meanBlock).join("")}` : ""}
    `;
  }

  function openSheet(i){
    current = filtered[i];
    if(!current) return;
    const s = document.createElement("div");
    s.className = "word-sheet"; s.id = "wordSheet";
    s.innerHTML = `<div class="sheet">${renderSheet(current)}</div>`;
    s.addEventListener("click", e=>{ if(e.target===s) closeSheet(); });
    document.body.appendChild(s);
    document.body.style.overflow = "hidden";
    const c = document.getElementById("sheetClose");
    if(c) c.addEventListener("click", closeSheet);
  }
  function closeSheet(){
    document.getElementById("wordSheet")?.remove();
    document.body.style.overflow = "";
  }
  window._wordTTS = function(text){
    try{
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "ar-SA"; u.rate = .78;
      window.speechSynthesis.speak(u);
    }catch(e){}
  };

  function apply(){
    const q = (document.getElementById("wSearch")?.value || "").trim().toLowerCase();
    const sn = parseInt(document.getElementById("surahFilter")?.value || "0", 10);
    const favOnly = document.getElementById("favOnly")?.checked;
    filtered = WORDS.filter(x=>{
      if(isPlaceholder(x.w) && q) return false;
      if(sn && x.surah !== sn) return false;
      if(favOnly && !favee.has(x.id)) return false;
      if(!q) return true;
      const hay = [x.w, x.tr, x.en, x.bn, x.root, x.form, x.why, x.root_analysis_text].join(" ").toLowerCase();
      return hay.includes(q);
    });
    const grid = document.getElementById("wordGrid");
    grid.innerHTML = filtered.map(tile).join("");
    grid.hidden = filtered.length === 0;
    document.getElementById("wEmpty").hidden = filtered.length !== 0;
    const ph = WORDS.filter(isPlaceholder).length;
    document.getElementById("wCount").textContent = q
      ? `${filtered.length} of ${WORDS.length} words`
      : `${WORDS.length - ph} study words · ${ph} pending research`;
    grid.querySelectorAll(".word-tile").forEach(t=>{
      const i = parseInt(t.dataset.i, 10);
      t.addEventListener("click", ()=>openSheet(i));
      t.addEventListener("keydown", e=>{ if(e.key==="Enter"||e.key===" ") { e.preventDefault(); openSheet(i); } });
    });
  }

  function boot(data){
    // attach root_analysis text + stable ids for favorites
    data.forEach((x,idx)=>{ x.id = idx + 1; if(x.ra && typeof x.ra === "object"){
      const parts=[x.ra.linguistic,x.ra.sci,x.ra.trait].filter(Boolean);
      x.root_analysis_text = x.root_analysis_text || parts.join(" · ");
    }});
    WORDS = data;
    document.getElementById("wLoading").hidden = true;
    initSurahFilter();
    apply();
    document.getElementById("wSearch")?.addEventListener("input", apply);
    document.getElementById("surahFilter")?.addEventListener("change", apply);
    document.getElementById("favOnly")?.addEventListener("change", apply);
    document.getElementById("wordGrid").addEventListener("click", e=>{
      if(e.target.closest(".w-chip.favchip")) return;
    });
  }

  document.addEventListener("DOMContentLoaded", ()=>{
    fetch("assets/data/words_export.json")
      .then(r=>{ if(!r.ok) throw new Error("HTTP "+r.status); return r.json(); })
      .then(boot)
      .catch(()=>{
        const el = document.getElementById("wLoading");
        el.textContent = "Word data could not load — check your connection and reload.";
      });
  });
})();
