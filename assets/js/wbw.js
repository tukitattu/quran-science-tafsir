/* Word-by-word meanings — loads assets/data/wbw/{surah}.json on first tap
 * and shows a popover: Arabic + transliteration + English + Bengali + audio.
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

  function esc(t) { var d = document.createElement("div"); d.textContent = t == null ? "" : t; return d.innerHTML; }

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

  function show(span) {
    var ayahEl = span.closest(".ayah");
    if (!ayahEl) return;
    var n = parseInt(span.getAttribute("data-s"), 10);
    var a = parseInt(ayahEl.getAttribute("data-a"), 10);
    var i = parseInt(span.getAttribute("data-p"), 10);
    pending = { n: n, a: a, i: i, span: span };
    load(n).then(function (d) {
      if (!pending || pending.n !== n) return;
      var row = null;
      for (var k = 0; k < d.ayahs.length; k++) if (d.ayahs[k].a === a) { row = d.ayahs[k]; break; }
      if (!row) return;
      var w = row.w[i - 1];
      if (!w) return;
      hide();
      pop = document.createElement("div");
      pop.id = "wbw-pop";
      pop.innerHTML =
        '<button class="wbw-x" aria-label="Close">✕</button>' +
        '<div class="wbw-ar" dir="rtl" lang="ar">' + esc(w.t) + "</div>" +
        (w.tr ? '<div class="wbw-tr">' + esc(w.tr) + "</div>" : "") +
        (w.en ? '<div class="wbw-en"><b>EN</b> ' + esc(w.en) + "</div>" : "") +
        (w.bn ? '<div class="wbw-bn"><b>বাংলা</b> ' + esc(w.bn) + "</div>" : "") +
        (w.au ? '<button class="wbw-audio" data-play-word="' + esc(w.au) + '">▶ hear the word</button>' : "");
      document.body.appendChild(pop);
      pop.querySelector(".wbw-x").addEventListener("click", hide);
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
