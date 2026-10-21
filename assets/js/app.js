/* lazily pull in the shared mobile/a11y upgrades (skip link, progress bar, swipe nav) */
(function () {
  var own = document.querySelector('script[src$="/app.js"], script[src$="app.js"]');
  var href = own ? own.getAttribute("src") : "";
  if (href) {
    href = href.replace(/app\.js$/, "ux-mobile.js");
    var s = document.createElement("script");
    s.src = href;
    s.defer = true;
    document.head.appendChild(s);
  }
})();

const I18N = {
  en: {
    tagline: "Al Quran — Scientific Tafsir",
    home: "Home",
    read: "Read Online",
    download: "Download PDF",
    parts: "The Three Parts",
    chaptersTitle: "All 114 Chapters (Surahs)",
    footerNote: "Scientific Tafsir of the Quran by Zakaria Kamal. Freely shareable and publishable per the author's notice.",
    note: "The book text is in English; the site interface is available in English, বাংলা and العربية.",
    reader: {
      back: "All Parts",
      chapters: "Chapters in this part",
      page: "Page",
      of: "of",
      prev: "Previous",
      next: "Next",
      first: "First",
      last: "Last",
      zoomIn: "Zoom In",
      zoomOut: "Zoom Out",
      search: "Search in PDF…",
      noResults: "No matches found",
      loading: "Loading PDF…"
    }
  },
  bn: {
    tagline: "আল কুরআন — বৈজ্ঞানিক তাফসির",
    home: "প্রথম পাতা",
    read: "অনলাইনে পড়ুন",
    download: "PDF ডাউনলোড",
    parts: "তিনটি অংশ",
    chaptersTitle: "সব ১১৪টি সূরা",
    footerNote: "জাকারিয়া কামাল রচিত আল-কুরআনের বৈজ্ঞানিক তাফসির। লেখকের বিজ্ঞপ্তি অনুযায়ী অবাধে শেয়ার ও প্রকাশযোগ্য।",
    note: "বইয়ের মূল লেখা ইংরেজিতে; সাইটের ইন্টারফেস ইংরেজি, বাংলা ও আরবিতে উপলব্ধ।",
    reader: {
      back: "সব অংশ",
      chapters: "এই অংশের সূরাসমূহ",
      page: "পৃষ্ঠা",
      of: "এর মধ্যে",
      prev: "আগের",
      next: "পরের",
      first: "প্রথম",
      last: "শেষ",
      zoomIn: "বড় করুন",
      zoomOut: "ছোট করুন",
      search: "PDF-এ খুঁজুন…",
      noResults: "কোনো ফলাফল পাওয়া যায়নি",
      loading: "PDF লোড হচ্ছে…"
    }
  },
  ar: {
    tagline: "القرآن الكريم — التفسير العلمي",
    home: "الرئيسية",
    read: "اقرأ مباشرة",
    download: "تحميل PDF",
    parts: "الأجزاء الثلاثة",
    chaptersTitle: "السور الـ ١١٤",
    footerNote: "التفسير العلمي للقرآن الكريم بقلم زكريا كمال. يُسمح بنشره ومشاركته بحرية وفقًا لتنبيه المؤلف.",
    note: "نص الكتاب بالإنجليزية؛ وواجهة الموقع متاحة بالإنجليزية والبنغالية والعربية.",
    reader: {
      back: "جميع الأجزاء",
      chapters: "سور هذا الجزء",
      page: "الصفحة",
      of: "من",
      prev: "السابق",
      next: "التالي",
      first: "الأولى",
      last: "الأخيرة",
      zoomIn: "تكبير",
      zoomOut: "تصغير",
      search: "ابحث في الملف…",
      noResults: "لا توجد نتائج",
      loading: "جارٍ تحميل الملف…"
    }
  }
};

const LANGS = ["all", "en", "bn", "ar"];
const LANG_LABEL = { all: "EN+বাং", en: "English", bn: "বাংলা", ar: "العربية" };
// uiLang is the language of the interface strings; "all" shows the full
// bilingual content (EN + BN) at once, which is the default.
let lang = localStorage.getItem("quran-lang") || "all";
if (!LANGS.includes(lang)) lang = "all";
const uiLang = () => (lang === "all" ? "en" : lang);

function t(key) {
  return key.split(".").reduce((o, k) => (o ? o[k] : undefined), I18N[uiLang()]) || key;
}

function setLang(l, init) {
  lang = l;
  localStorage.setItem("quran-lang", l);
  document.documentElement.lang = uiLang();
  document.body.dir = l === "ar" ? "rtl" : "ltr";
  document.body.className = (document.body.className || "")
    .replace(/\s(lang|content)-[a-z]{2,3}/g, "") + " lang-" + uiLang() + " content-" + l;
  document.querySelectorAll("[data-lang]").forEach((btn) => {
    btn.classList.toggle("active", btn.getAttribute("data-lang") === l);
  });
  document.body.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.getAttribute("data-i18n"));
  });
  document.body.querySelectorAll("[data-i18n-ph]").forEach((el) => {
    el.placeholder = t(el.getAttribute("data-i18n-ph"));
  });
  if (typeof onLangChange === "function" && !init) onLangChange(l);
}

function initLang() {
  // inject the "All" (bilingual) option once, before the visible choices
  document.querySelectorAll(".langbtns").forEach((host) => {
    if (host.querySelector('[data-lang="all"]')) return;
    const b = document.createElement("button");
    b.setAttribute("data-lang", "all");
    b.textContent = LANG_LABEL.all;
    b.title = "Show the full English + Bangla content";
    host.insertBefore(b, host.firstChild);
  });
  document.querySelectorAll(".langbtns [data-lang]").forEach((btn) => {
    btn.addEventListener("click", () => setLang(btn.getAttribute("data-lang")));
  });
  // make "All" the highlighted default when nothing has been chosen yet
  document.querySelectorAll('[data-lang="all"]').forEach((b) => b.classList.toggle("active", lang === "all"));
  setLang(lang, true);
}

// --- eTarabic-inspired: streak, progress, today, kids, offline ---
function updateStreak(){
  const k='tafsir-streak', d='tafsir-last';
  const today=new Date().toISOString().slice(0,10);
  const last=localStorage.getItem(d);
  let streak=parseInt(localStorage.getItem(k)||'0');
  if(last!==today){
    const y=new Date(Date.now()-86400000).toISOString().slice(0,10);
    streak = (last===y) ? streak+1 : 1;
    localStorage.setItem(k, streak);
    localStorage.setItem(d, today);
  }
  const el=document.getElementById('streakCount');
  if(el) el.textContent=streak;
}
function updateProgress(){
  const visited = JSON.parse(localStorage.getItem('tafsir-visited')||'[]');
  const m=location.pathname.match(/chapters\/(\d+)\.html/);
  if(m){
    const n=parseInt(m[1]);
    if(!visited.includes(n)){ visited.push(n); localStorage.setItem('tafsir-visited', JSON.stringify(visited)); }
  }
  const pct=Math.round(visited.length/114*100);
  const bar=document.getElementById('progressBar');
  const txt=document.getElementById('progressText');
  const pctEl=document.getElementById('progressPct');
  if(bar) bar.style.width=pct+'%';
  if(txt) txt.textContent=visited.length+'/114';
  if(pctEl) pctEl.textContent=pct+'%';
}
function setupKids(){
  const btns=document.querySelectorAll('.kids-toggle');
  const saved=localStorage.getItem('tafsir-kids')==='1';
  if(saved) document.body.classList.add('kids');
  // Update all buttons to reflect current state
  const updateBtns=()=>{
    const on=document.body.classList.contains('kids');
    const svgKids='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;margin-right:4px"><circle cx="12" cy="7" r="4"/><path d="M12 11c-3 0-6 1.5-6 4v2h12v-2c0-2.5-3-4-6-4z"/><path d="M15 14l-3 3-2-2"/></svg> Kids';
    const svgNormal='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="vertical-align:-2px;margin-right:4px"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg> Normal';
    btns.forEach(b=>{ b.innerHTML = on ? svgNormal : svgKids; b.setAttribute('aria-pressed', on); });
  };
  updateBtns();
  btns.forEach(btn=>{
    btn.addEventListener('click',()=>{
      try{
        document.body.classList.toggle('kids');
        const on=document.body.classList.contains('kids');
        localStorage.setItem('tafsir-kids', on?'1':'0');
        updateBtns();
        // Smooth scroll to top to show simplified view
        window.scrollTo({top:0, behavior:'smooth'});
      }catch(e){ console.error('Kids toggle failed', e); }
    });
  });
  // Handle missing button gracefully
  if(btns.length===0) console.warn('Kids toggle button not found');
}
function setupToday(){
  const ayahs=[
    {ar:'اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ', bn:'“পড়ো তোমার রবের নামে, যিনি সৃষ্টি করেছেন।” — সূরা আল-আলাক ৯৬:১', link:'chapters/96.html'},
    {ar:'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ', bn:'“পরম করুণাময় দয়ালুর নামে।” — সূরা ফাতিহা ১:১', link:'chapters/1.html'},
    {ar:'وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا', bn:'“যে আল্লাহকে ভয় করে, তিনি তার জন্য পথ খুলে দেন।” — তালাক ৬৫:২', link:'chapters/65.html'},
    {ar:'رَبِّ زِدْنِي عِلْمًا', bn:'“হে আমার রব, আমার জ্ঞান বাড়িয়ে দিন।” — ত্বহা ২০:১১৪', link:'chapters/20.html'},
    {ar:'إِنَّ مَعَ الْعُسْرِ يُسْرًا', bn:'“নিশ্চয় কষ্টের সাথে স্বস্তি আছে।” — ইনশিরাহ ৯৪:৬', link:'chapters/94.html'}
  ];
  const day=new Date().getDate();
  const a=ayahs[day % ayahs.length];
  const elA=document.getElementById('todayAyah');
  const elT=document.getElementById('todayTrans');
  const elL=document.getElementById('todayLink');
  if(elA) elA.textContent=a.ar;
  if(elT) elT.textContent=a.bn;
  if(elL) elL.href=a.link;
}

// --- v5 additions: navigation pills, continue reading, reader controls ---
// Absolute base for root-level assets, derived from this script's own URL so it
// works at any page depth (/chapters/N/read/pageX.html included) and under a
// GitHub Pages project subpath.
const APP_BASE = (function(){
  try {
    const s = document.currentScript;
    if (s && s.src) return s.src.replace(/assets\/js\/app\.js(?:\?.*)?$/, "");
  } catch (e) {}
  const p = location.pathname;
  if (/\/chapters\/\d+\/read\//.test(p) || p.includes("/read/")) return "../../../";
  if (p.includes("/chapters/")) return "../";
  return "";
})();
function relBase(){ return APP_BASE; }
function injectBrand(){
  const a = document.querySelector(".topbar .brand");
  if(!a || a.querySelector(".brand-logo")) return;
  const img = document.createElement("img");
  img.className = "brand-logo";
  img.src = relBase() + "assets/logo-mark.png";
  img.alt = "";
  img.width = 34; img.height = 34;
  const svg = a.querySelector("svg");
  if(svg) svg.replaceWith(img); else a.insertBefore(img, a.firstChild);
}
function injectTopNav(){
  const host = document.querySelector(".top-actions");
  if(!host || document.querySelector(".nav-pills")) return;
  const b = relBase();
  const p = location.pathname;
  const is = (m)=> p.includes(m);
  const el = document.createElement("nav");
  el.className = "nav-pills";
  el.setAttribute("aria-label", "Site navigation");
  el.innerHTML = [
    ["search.html", "Search", is("search.html")],
    ["words.html", "Word Meanings", is("words.html")],
    ["business.html", "Business", is("business.html")],
    ["vocabulary.html", "Vocabulary", is("vocabulary.html")]
  ].map(([href,label,cur])=>`<a href="${b}${href}" ${cur?'class="cur" aria-current="page"':'aria-current="false"'}>${label}</a>`).join("");
  host.insertBefore(el, host.firstChild);

  // mobile: collapse the whole action shelf behind a menu button
  const bar = document.querySelector(".topbar");
  if(bar && !bar.querySelector(".nav-menu-btn")){
    const btn = document.createElement("button");
    btn.className = "nav-menu-btn";
    btn.setAttribute("aria-label","Menu");
    btn.setAttribute("aria-expanded","false");
    btn.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';
    btn.addEventListener("click", ()=>{
      const open = host.classList.toggle("open");
      btn.setAttribute("aria-expanded", open?"true":"false");
    });
    bar.appendChild(btn);
  }
}

// lazily pull in the knowledge-pill component on reading / overview pages
function loadKnowledge(){
  if(!document.querySelector(".ch-body") && !document.querySelector(".quote")) return;
  if(document.querySelector('script[data-knowledge]')) return;
  const s = document.createElement("script");
  s.src = relBase()+"assets/js/knowledge.js";
  s.defer = true;
  s.setAttribute("data-knowledge","1");
  document.head.appendChild(s);
}
function saveReadSpot(){
  // remember the reading position only on reading pages
  if(!document.querySelector(".ch-body")) return;
  const m = location.pathname.match(/chapters\/(\d+)(?:\/read\/(\d+)\.html)?/);
  if(!m) return;
  const h = document.querySelector(".chapter-head h1") || document.title.split("—")[0];
  localStorage.setItem("tafsir-last-read", JSON.stringify({
    surah: parseInt(m[1]), page: m[2]? parseInt(m[2]) : null, title: h, t: Date.now()
  }));
}
function injectContinueReading(){
  if(!/(part[123]\.html|index\.html)$/.test(location.pathname)) return;
  try{
    const spot = JSON.parse(localStorage.getItem("tafsir-last-read")||"null");
    if(!spot || !spot.surah) return;
    const b = relBase();
    const wrap = document.querySelector(".hero");
    if(!wrap || document.getElementById("continueRead")) return;
    const chip = document.createElement("a");
    chip.className = "btn gold";
    chip.href = `${b}chapters/${spot.surah}.html`;
    chip.id = "continueRead";
    const label = spot.page ? `${spot.title || ("Surah " + spot.surah)} · page ${spot.page}` : (spot.title || ("Surah " + spot.surah));
    chip.textContent = "▶ Continue reading — " + label;
    chip.style.marginTop = "14px";
    wrap.appendChild(chip);
  }catch(e){}
}
function injectReaderControls(){
  if(!document.querySelector(".ch-body")) return;
  const wrap = document.createElement("div");
  wrap.className = "read-size";
  wrap.innerHTML = `<button id="fsMinus" title="Smaller text" aria-label="Smaller text">A−</button><button id="fsPlus" title="Larger text" aria-label="Larger text">A+</button>`;
  document.body.appendChild(wrap);
  if(!wrap.querySelector("#fsMinus") || !wrap.querySelector("#fsPlus")) return;
  const body = document.querySelector(".ch-body");
  const apply = (px)=>{ document.documentElement.style.setProperty("--read-px", px+"px"); body.style.fontSize = px+"px"; };
  let px = parseInt(localStorage.getItem("tafsir-px")||"16", 10);
  if (px!==16) apply(px);
  wrap.querySelector("#fsMinus").addEventListener("click", ()=>{ px=Math.max(13,px-1); localStorage.setItem("tafsir-px",px); apply(px); });
  wrap.querySelector("#fsPlus").addEventListener("click", ()=>{ px=Math.min(22,px+1); localStorage.setItem("tafsir-px",px); apply(px); });
}
function injectArabicLink(){
  const read = location.pathname.match(/\/chapters\/(\d+)\/read\//);
  const overview = location.pathname.match(/\/chapters\/(\d+)\.html$/);
  let href = null;
  if (read) href = "../arabic.html";
  else if (overview) href = `${overview[1]}/arabic.html`;
  if (!href) return;
  const host = document.querySelector(".top-actions");
  if (!host || host.querySelector(".ar-link")) return;
  const a = document.createElement("a");
  a.className = "btn ghost ar-link";
  a.href = href;
  a.textContent = "النص العربي";
  a.title = "Arabic-only reading";
  a.style.textDecoration = "none";
  host.prepend(a);
}
function loadTilawah(){
  if (window.QuranPlayer) {
    if (window.__QuranPlayQueue && window.__QuranPlayQueue.length) {
      var q = window.__QuranPlayQueue.splice(0);
      q.forEach(function(fn){ try{ fn(); }catch(e){} });
    }
    return;
  }
  window.__QuranPlayQueue = window.__QuranPlayQueue || [];
  var sc = document.createElement("script");
  sc.src = relBase() + "assets/js/player.js";
  sc.defer = true;
  document.head.appendChild(sc);
}
function injectPlayButton(){
  const read = location.pathname.match(/\/chapters\/(\d+)\/read\//);
  const overview = location.pathname.match(/\/chapters\/(\d+)\.html$/);
  const n = read ? read[1] : (overview ? overview[1] : null);
  if (!n) return;
  const host = document.querySelector(".top-actions");
  if (!host || host.querySelector("[data-play-surah]")) return;
  const b = document.createElement("button");
  b.className = "btn";
  b.setAttribute("data-play-surah", n);
  b.textContent = "\u25B6 Tilawah";
  b.title = "Play this surah — streaming audio";
  b.addEventListener("click", function(){
    if (window.QuranPlayer) return; // player.js delegation handles it
    loadTilawah();
    window.__QuranPlayQueue.push(function(){
      if (window.QuranPlayer) window.QuranPlayer.playSurah(+n);
    });
  });
  host.prepend(b);
  loadTilawah();
}
function injectToTop(){
  const btn = document.createElement("button");
  btn.className = "to-top"; btn.title = "Back to top"; btn.setAttribute("aria-label","Back to top");
  btn.textContent = "↑";
  btn.addEventListener("click", ()=> window.scrollTo({top:0, behavior:"smooth"}));
  document.body.appendChild(btn);
  addEventListener("scroll", ()=> btn.classList.toggle("show", scrollY > 600), {passive:true});
}

document.addEventListener("DOMContentLoaded", ()=>{
  // initLang already handled above, but ensure once
  try{ initLang(); }catch{}
  updateStreak();
  updateProgress();
  setupKids();
  setupToday();
  try{ injectBrand(); }catch(e){ console.error("brand", e); }
  try{ injectTopNav(); }catch(e){ console.error("nav", e); }
  try{ loadKnowledge(); }catch(e){ console.error("knowledge", e); }
  try{ injectContinueReading(); }catch(e){ console.error("continue", e); }
  try{ injectReaderControls(); }catch(e){ console.error("readsizer", e); }
  try{ injectArabicLink(); }catch(e){ console.error("arabic-link", e); }
  try{ injectPlayButton(); }catch(e){ console.error("play-btn", e); }
  try{ injectToTop(); }catch(e){ console.error("totop", e); }
  try{ saveReadSpot(); }catch(e){ console.error("spot", e); }
  if('serviceWorker' in navigator && !location.pathname.includes('sw.js')){
    navigator.serviceWorker.register(relBase()+'sw.js').catch(()=>{});
  }
});
/* =================== Phase 3: surah-page anchor tabs =================== */
(function(){
  if (window.__surahTabs) return;
  window.__surahTabs = true;
  const PATTERNS = [
    ["kb-context-", "Context"], ["kb-roots-", "Roots"], ["kb-science-", "Science"],
    ["kb-ghaur-", "Videos"], ["kb-alt-", "Alt meanings"], ["kb-wiki-", "Wiki"], ["deep-", "Deep research"]
  ];
  const first = document.querySelector('[id^="kb-context-"]');
  if (!first) return;
  const n = (first.id.match(/-(\d+)$/) || [])[1];
  if (!n) return;
  const items = [];
  for (const [pfx, label] of PATTERNS) {
    if (pfx === "deep-" ? document.getElementById("deep-" + n) : document.getElementById(pfx + n)) items.push([pfx + n, label]);
  }
  if (!items.length) return;
  const bar = document.createElement("div");
  bar.className = "anchor-tabbar";
  bar.setAttribute("role", "tablist");
  bar.setAttribute("aria-label", "Jump to section");
  bar.innerHTML = items.map(([id, label]) =>
    `<button type="button" role="tab" class="anchor-tab" data-target="${id}">${label}</button>`).join("");
  const anchor = document.getElementById("kb-" + n) || first;
  anchor.parentNode.insertBefore(bar, anchor);
  bar.addEventListener("click", e => {
    const b = e.target.closest(".anchor-tab");
    if (!b) return;
    bar.querySelectorAll(".anchor-tab").forEach(x => x.classList.remove("on"));
    b.classList.add("on");
    const t = document.getElementById(b.dataset.target);
    if (t) t.scrollIntoView({ behavior: "smooth", block: "start" });
  });
})();

/* =================== Phase 4: home tabs (Browse / Continue / Marked) =================== */
(function(){
  if (window.__homeTabs) return;
  window.__homeTabs = true;
  const grid = document.getElementById("chaptersGrid");
  if (!grid || document.querySelector(".home-tabs")) return;

  const esc2 = s => String(s==null?"":s).replace(/[<>&"]/g, c=>({"<":"&lt;",">":"&gt;","&":"&amp;",'"':"&quot;"}[c]));
  const NAMES = {};
  try {
    const ch = (typeof QURAN !== "undefined" && QURAN.chapters) || (window.CHAPTERS && (window.CHAPTERS.chapters || window.CHAPTERS)) || [];
    (Array.isArray(ch) ? ch : Object.values(ch)).forEach(c => { if (c && c.n) NAMES[c.n] = c; });
  } catch(e) {}

  /* panes */
  const tabs = document.createElement("div");
  tabs.className = "home-tabs";
  tabs.innerHTML =
    '<button type="button" class="ht on" data-pane="browse">📖 Browse</button>' +
    '<button type="button" class="ht" data-pane="continue">⏩ Continue</button>' +
    '<button type="button" class="ht" data-pane="marked">🔖 Marked</button>';

  const paneBrowse = document.createElement("div");
  paneBrowse.className = "ht-pane on";
  const paneContinue = document.createElement("div");
  paneContinue.className = "ht-pane";
  const paneMarked = document.createElement("div");
  paneMarked.className = "ht-pane";

  /* move the existing filter section + grid into the browse pane */
  const gridSec = grid.closest("section") || grid;
  const fb = document.getElementById("filterBar");
  const filterSec = fb ? fb.closest("section") || fb : null;
  const anchor0 = document.createElement("div");
  gridSec.parentNode.insertBefore(anchor0, gridSec);
  if (filterSec) paneBrowse.appendChild(filterSec);
  paneBrowse.appendChild(gridSec);
  anchor0.replaceWith(tabs);
  tabs.after(paneBrowse);
  paneContinue.className = "ht-pane";
  paneContinue.id = "htContinue";
  paneMarked.id = "htMarked";
  paneBrowse.after(paneContinue);
  paneContinue.after(paneMarked);

  function setPane(name){
    tabs.querySelectorAll(".ht").forEach(b => b.classList.toggle("on", b.dataset.pane === name));
    paneBrowse.classList.toggle("on", name === "browse");
    paneContinue.classList.toggle("on", name === "continue");
    paneMarked.classList.toggle("on", name === "marked");
    if (name === "continue") buildContinue();
    if (name === "marked") buildMarked();
  }
  tabs.addEventListener("click", e => {
    const b = e.target.closest(".ht");
    if (b) setPane(b.dataset.pane);
  });

  /* ---- continue pane: resume card + reading history ---- */
  function buildContinue(){
    let spot = null, hist = [];
    try { spot = JSON.parse(localStorage.getItem("tafsir-last-read") || "null"); } catch(e){ spot = null; }
    try { hist = JSON.parse(localStorage.getItem("quran-history") || "[]"); } catch(e){ hist = []; }
    const b = location.pathname.replace(/index\.html.*$/, "");
    if (spot && spot.surah) {
      const c = NAMES[spot.surah] || {};
      const link = (b ? b : "") + "chapters/" + spot.surah + (spot.page ? "/read/page" + spot.page + ".html" : ".html");
      let card = `<a class="continue-card" href="${esc2(link)}">
        <span class="cc-num">${c.n ?? spot.surah}</span>
        <span class="cc-body"><b>${esc2(c.ar || "")}</b> ${esc2(spot.title || c.en || "Surah " + spot.surah)}${spot.page ? ` <span class="cc-page">page ${esc2(spot.page)}</span>` : ""}
        <span class="cc-sub">Tap to resume reading</span></span></a>`;
      paneContinue.innerHTML = card;
    } else {
      paneContinue.innerHTML = `<div class="continue-card empty"><span class="cc-body"><b>Nothing to resume yet.</b> <span class="cc-sub">Open a surah and your position is remembered here automatically.</span></span></div>`;
    }
    if (hist.length > 1) {
      let list = '<div class="hist-title">Recently read</div>';
      hist.slice(0, 9).forEach(h => {
        const c = NAMES[h.surah] || {};
        const link = (b ? b : "") + "chapters/" + h.surah + (h.page ? "/read/page" + h.page + ".html" : ".html");
        list += `<a class="hist-item" href="${esc2(link)}"><span class="hi-num">${c.n ?? h.surah}</span><span class="hi-name"><b>${esc2(h.title || c.en || ("Surah " + h.surah))}</b>${h.page ? `<span class="cc-page">· p${esc2(h.page)}</span>` : ""}</span></a>`;
      });
      paneContinue.appendChild((() => { const d = document.createElement("div"); d.className = "hist-list"; d.innerHTML = list; return d; })());
    }
  }

  /* ---- marked pane: surahs with saved annotations ---- */
  function buildMarked(){
    const stores = ["quranNotes", "quranHighlights", "quranRead"];
    const touched = {};
    stores.forEach(k => {
      try { Object.keys(JSON.parse(localStorage.getItem(k) || "{}")).forEach(key => {
        const p = key.split(":");
        if (p.length === 2) (touched[p[0]] = touched[p[0]] || []).push(p[1]);
      }); } catch(e){}
    });
    const keys = Object.keys(touched).map(Number).sort((x, y) => x - y);
    if (!keys.length) {
      paneMarked.innerHTML = `<div class="continue-card empty"><span class="cc-body"><b>No marked surahs yet.</b> <span class="cc-sub">Highlight ‖, note ✎ or mark ✓ ayahs while reading — they show up here.</span></span></div>`;
      return;
    }
    let html = keys.map(n => {
      const c = NAMES[n] || {};
      return `<a class="hist-item" href="${location.pathname.replace(/index\.html.*$/, "")}chapters/${n}/arabic.html"><span class="hi-num">${c.n ?? n}</span><span class="hi-name"><b dir="rtl" lang="ar">${esc2(c.ar || "")}</b> ${esc2(c.en || "Surah " + n)} <span class="cc-page">${touched[n].length} mark${touched[n].length>1?"s":""}</span></span></a>`;
    }).join("");
    paneMarked.innerHTML = html;
  }

  /* ---- history log: extend saveReadSpot ---- */
  try {
    const cur = JSON.parse(localStorage.getItem("quran-history") || "[]");
    if (typeof window.__histHook === "undefined") {
      window.__histHook = true;
      const orig = saveReadSpot;
      saveReadSpot = function(){
        orig();
        const m = location.pathname.match(/chapters\/(\d+)(?:\/read\/(\d+)\.html)?/);
        if (!m) return;
        const h = document.querySelector(".chapter-head h1") || document.title.split("—")[0];
        const entry = { surah: parseInt(m[1]), page: m[2] ? parseInt(m[2]) : null, title: h, t: Date.now() };
        const hist = [entry, ...cur.filter(x => !(x.surah === entry.surah && String(x.page) === String(entry.page)))].slice(0, 12);
        localStorage.setItem("quran-history", JSON.stringify(hist));
      };
    }
  } catch(e){}
})();
