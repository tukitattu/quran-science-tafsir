/* Word-by-word meanings — loads assets/data/wbw/{surah}.json on first tap
 * and shows a popover: Arabic + transliteration + English + Bengali + audio.
 * Adds per-ayah deep root/etymology/morphology studies (words_export.json)
 * and an always-on corpus.quran.com morphology link.
 * Only included on chapters/N/arabic.html pages.
 */
(function () {
  "use strict";
  var src = (document.currentScript && document.currentScript.src) || "";
  var BASE = src.replace(/assets\/js\/wbw\.js.*$/, "");
  var cache = {}, pop = null, pending = null;

  function load(n) {
    if (cache[n] && cache[n].then) return cache[n];
    cache[n] = fetch(BASE + "assets/data/wbw/" + n + ".json")
      .then(function (r) { if (!r.ok) throw new Error("wbw " + n + " " + r.status); return r.json(); })
      .then(function (d) { cache[n] = d; return d; })
      .catch(function (e) { delete cache[n]; throw e; });
    return cache[n];
  }

  /* deep root/etymology entries (words_export.json, lazy, one fetch, indexed by "s:a") */
  var deep = null;
  function deepLoad() {
    if (deep && deep.then) return deep;
    var p = fetch(BASE + "assets/data/words_export.json")
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (list) {
        var map = {};
        (list || []).forEach(function (x) {
          var k = (x.ref || (x.surah + ":1")).split(":");
          var key = parseInt(k[0], 10) + ":" + parseInt(k[1], 10);
          (map[key] = map[key] || []).push(x);
        });
        deep = map;
        return map;
      })
      .catch(function (e) { console.warn("deep words:", e); return (deep = {}); });
    deep = p;
    return p;
  }

  function esc(t) { var d = document.createElement("div"); d.textContent = t == null ? "" : t; return d.innerHTML; }

  function deepKeyFor(n, a) { return n + ":" + a; }

  /* aggressive normalizer used to decide the "this word" auto-open */
  function arabicNorm(t) {
    return (t || "").replace(/[\u064B-\u065F\u0670\u0640\u06D6-\u06ED\u0654\u0655\u08F0-\u08F3]/g, "")
      .replace(/[\u0623\u0625\u0622\u0671]/g, "\u0627").replace(/\u0649/g, "\u064A")
      .replace(/\s+/g, "");
  }

  function place(rect) {
    if (!pop) return;
    var w = pop.offsetWidth, h = pop.offsetHeight;
    var x = Math.min(Math.max(8, rect.left + rect.width / 2 - w / 2),
                     window.innerWidth - w - 8);
    var y = rect.top - h - 10;
    if (y < 8) y = rect.bottom + 10;
    pop.style.left = x + "px";
    pop.style.top = y + "px";
  }

  function hide() { if (pop) { pop.remove(); pop = null; } }

  function buildDeepHTML(entries, tappedNorm) {
    if (!entries || !entries.length) return "";
    var items = "";
    entries.forEach(function (x) {
      var ra = x.root ? x : (x.ra || {});
      var ww = x.w || "";
      var root = x.root || ra.root || "";
      var pattern = ra.pattern || x.form || "";
      var open = tappedNorm && arabicNorm(ww) === tappedNorm ? " open" : "";
      items +=
        '<details class="wbw-deep-item' + open + '">' +
        '<summary><span class="wbw-dw" dir="rtl" lang="ar">' + esc(ww) + "</span>" +
        (root ? ' <span class="wbw-root" dir="rtl" lang="ar">' + esc(root) + "</span>" : "") +
        (pattern ? ' <span class="wbw-form">' + esc(pattern) + "</span>" : "") +
        "</summary>" +
        ((x.en || x.bn) ? '<div class="wbw-deep-meaning">' +
          (x.en ? "<div>" + esc(x.en) + "</div>" : "") +
          (x.bn ? '<div class="wbw-bn">' + esc(x.bn) + "</div>" : "") +
          "</div>" : "") +
        ((x.why || ra.bayyinah_note) ? '<div class="wbw-why">' + esc((x.why || ra.bayyinah_note) || "") + "</div>" : "") +
        "</details>";
    });
    return '<div class="wbw-deep"><span class="wbw-deep-head">Deep study — this ayah (' +
      entries.length + ")</span>" + items + "</div>";
  }

  function show(span) {
    var ayahEl = span.closest(".ayah");
    if (!ayahEl) return;
    var n = parseInt(span.getAttribute("data-s"), 10);
    var a = parseInt(ayahEl.getAttribute("data-a"), 10);
    var i = parseInt(span.getAttribute("data-p"), 10);
    pending = { n: n, a: a, i: i, span: span };
    deepLoad(); /* root/morphology data in parallel */
    load(n).then(function (d) {
      var req = pending && pending.n === n ? pending : null;
      if (!req || req.a !== a) return;
      var row = null;
      for (var k = 0; k < d.ayahs.length; k++) if (d.ayahs[k].a === a) { row = d.ayahs[k]; break; }
      if (!row) return;
      var w = row.w[i - 1];
      if (!w) return;
      hide();
      var deepPromise = deep && deep.then ? deep : null;
      var deepNow = deep && !deep.then ? deep : null;
      var entriesNow = deepNow ? (deepNow[deepKeyFor(n, a)] || []) : [];
      var tapped = arabicNorm(w.t);
      var corpusURL = "https://corpus.quran.com/wordbyword.jsp?chapter=" + n + "&verse=" + a + "#" + encodeURIComponent(w.t || "");
      pop = document.createElement("div");
      pop.id = "wbw-pop";
      pop._wbwReq = req;
      pop.innerHTML =
        '<button class="wbw-x" aria-label="Close">✕</button>' +
        '<div class="wbw-ar" dir="rtl" lang="ar">' + esc(w.t) + "</div>" +
        (w.tr ? '<div class="wbw-tr">' + esc(w.tr) + "</div>" : "") +
        buildDeepHTML(entriesNow, tapped) +
        (w.en ? '<div class="wbw-en"><b>EN</b> ' + esc(w.en) + "</div>" : "") +
        (w.bn ? '<div class="wbw-bn"><b>বাংলা</b> ' + esc(w.bn) + "</div>" : "") +
        '<a class="wbw-corpus" href="' + esc(corpusURL) + '" target="_blank" rel="noopener noreferrer">root &amp; morphology ↗ corpus.quran.com</a>' +
        (w.au ? '<button class="wbw-audio" data-play-word="' + esc(w.au) + '">▶ hear the word</button>' : "");
      document.body.appendChild(pop);
      pop.querySelector(".wbw-x").addEventListener("click", hide);
      /* deep data still loading? swap the studies in when it arrives */
      if (deepPromise) {
        deepPromise.then(function (map) {
          if (!pop || pop._wbwReq !== req || pop.querySelector(".wbw-deep")) return;
          var studies = map && map[deepKeyFor(n, a)];
          var block = buildDeepHTML(studies, tapped);
          if (!block) return;
          var anchor = pop.querySelector(".wbw-tr") || pop.querySelector(".wbw-ar");
          if (anchor && anchor.nextSibling) {
            var t = document.createElement("div");
            t.innerHTML = block;
            while (t.firstChild) pop.insertBefore(t.firstChild, anchor.nextSibling);
          }
          place(span.getBoundingClientRect());
        });
      }
      place(span.getBoundingClientRect());
      var all = document.querySelectorAll(".wbw.is-on");
      all.forEach(function (x) { x.classList.remove("is-on"); });
      span.classList.add("is-on");
    }).catch(function (e) {
      console.warn("wbw load:", e);
      if (pop) return;
      pop = document.createElement("div");
      pop.id = "wbw-pop";
      pop.innerHTML = '<div class="wbw-en">Meanings not available offline yet.</div>';
      document.body.appendChild(pop);
      place(span.getBoundingClientRect());
    });
  }

  document.addEventListener("click", function (e) {
    var w = e.target && e.target.closest ? e.target.closest(".wbw") : null;
    if (w) {
      e.preventDefault();
      e.stopPropagation();
      show(w);
      return;
    }
    if (pop && e.target && !e.target.closest("#wbw-pop")) hide();
  }, true);

  document.addEventListener("keydown", function (e) { if (e.key === "Escape") hide(); });
  window.addEventListener("scroll", hide, true);

  /* highlight + follow the ayah currently playing (per-ayah chains only) */
  document.addEventListener("quran-ayah-active", function (e) {
    var d = (e && e.detail) || {};
    if (d.mode !== "ayah" || !d.ayah) return;
    var sn = parseInt(document.body.getAttribute("data-surah") || "0", 10);
    if (sn && d.surah && d.surah !== sn) return;
    var prev = document.querySelectorAll(".ayah.is-active");
    for (var j = 0; j < prev.length; j++) prev[j].classList.remove("is-active");
    var el = document.getElementById("a" + d.ayah);
    if (!el) return;
    el.classList.add("is-active");
    var r = el.getBoundingClientRect();
    if (r.top < 70 || r.bottom > window.innerHeight - 100) {
      try { el.scrollIntoView({ block: "center", behavior: "smooth" }); }
      catch (err) { el.scrollIntoView(); }
    }
  });
})();
