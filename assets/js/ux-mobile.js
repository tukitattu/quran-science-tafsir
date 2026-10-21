/* ux-mobile.js — mobile/a11y upgrades: skip link, search entry, progress bar, swipe nav, index read-strips */
(function () {
  "use strict";
  if (window.__uxMobile) return;
  window.__uxMobile = true;

  var docEl = document.documentElement;
  var dir = docEl.getAttribute("dir") || "ltr";
  var body = document.body;

  /* ---------- 1. Skip link ---------- */
  var main = document.querySelector("main");
  if (main && !main.id) main.id = "main";
  if (main) {
    var skip = document.createElement("a");
    skip.href = "#main";
    skip.className = "skip-link";
    skip.textContent = dir === "rtl" ? "الانتقال إلى المحتوى" : "Skip to content";
    body.insertBefore(skip, body.firstChild);
  }

  /* ---------- 2. Search entry on arabic reading pages ---------- */
  if (body && body.dataset.surah) {
    var topbar = document.querySelector(".topbar");
    if (topbar && !topbar.querySelector(".search-entry")) {
      var se = document.createElement("a");
      se.className = "search-entry";
      se.href = "../../search.html";
      se.setAttribute("aria-label", "Search tafsir");
      se.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>';
      topbar.appendChild(se);
    }
  }

  /* ---------- 3. Reading progress bar ---------- */
  var bar = document.createElement("div");
  bar.id = "read-progress";
  bar.setAttribute("aria-hidden", "true");
  body.appendChild(bar);
  var raf = null;
  function paint() {
    raf = null;
    var h = docEl.scrollHeight - window.innerHeight;
    var p = h > 0 ? Math.min(1, Math.max(0, window.scrollY / h)) : 0;
    bar.style.transform = "scaleX(" + p + ")";
  }
  window.addEventListener("scroll", function () {
    if (raf == null) raf = requestAnimationFrame(paint);
  }, { passive: true });
  paint();

  /* ---------- 4. Swipe navigation (mobile) ---------- */
  var sx = 0, sy = 0, st = 0, tracking = false;

  function navLinks() {
    var nav = document.querySelector(".ayah-nav, .read-nav, .pager, nav");
    if (!nav) return { next: null, prev: null };
    var links = [].slice.call(nav.querySelectorAll("a[href]"));
    function pick(patterns) {
      for (var i = 0; i < links.length; i++) {
        var txt = (links[i].textContent || "") + " " + (links[i].className || "");
        for (var j = 0; j < patterns.length; j++) {
          if (patterns[j].test(txt)) return links[i].getAttribute("href");
        }
      }
      return null;
    }
    return {
      next: pick([/→/, /next|following|التالية/]),
      prev: pick([/←/, /prev|previous|السابقة/])
    };
  }

  function pageNeighbor(delta) {
    var m = location.pathname.match(/page(\d+)\.html$/);
    if (!m) return null;
    var n = parseInt(m[1], 10) + delta;
    if (n < 1) return null;
    var base = location.pathname.replace(/page\d+\.html$/, "page" + n + ".html");
    return base.replace(/^.*?(?=\/chapters\/)/, location.origin + "/");
  }

  function cacheGet(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }
  function cacheSet(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }

  function maybeGo(delta) {
    var nav = navLinks();
    var url = delta > 0 ? (nav.next || null) : (nav.prev || null);
    if (!url) url = pageNeighbor(delta);
    if (!url) return;
    /* resolve pageNav relative hrefs against the arabic page directory */
    if (!/^(https?:)?\/\//.test(url) && url.charAt(0) !== "/") {
      url = new URL(url, location.href).href;
    }
    var ck = "ux404:" + url;
    if (cacheGet(ck) === "1") return;
    var xhr = new XMLHttpRequest();
    xhr.open("HEAD", url);
    xhr.onload = function () {
      if (xhr.status < 400) location.href = url;
      else cacheSet(ck, "1");
    };
    xhr.onerror = function () { cacheSet(ck, "1"); };
    xhr.send();
  }

  document.addEventListener("touchstart", function (e) {
    if (e.touches.length !== 1) { tracking = false; return; }
    var t = e.target;
    /* never hijack words, player controls, notes UI, or any interactive element */
    if (t.closest && t.closest(".wbw, .wbw-pop, audio, video, button, a, input, select, textarea, .langbtns, .top-actions, #qp-toggle, #qp-close, .knowledge-pill, .note-controls, .ayah-actions, .notes-modal")) {
      tracking = false; return;
    }
    tracking = true;
    sx = e.touches[0].clientX;
    sy = e.touches[0].clientY;
    st = Date.now();
  }, { passive: true });

  document.addEventListener("touchend", function (e) {
    if (!tracking) return;
    tracking = false;
    if (Date.now() - st > 800) return;
    var dx = e.changedTouches[0].clientX - sx;
    var dy = e.changedTouches[0].clientY - sy;
    if (Math.abs(dx) < 70 || Math.abs(dx) < 1.6 * Math.abs(dy)) return;
    /* LTR: left = next / RTL: right = next */
    var wantNext = dir === "rtl" ? dx > 0 : dx < 0;
    maybeGo(wantNext ? 1 : -1);
  }, { passive: true });

  /* ---------- 5. Index card read-progress strips ---------- */
    var grid = document.getElementById("chaptersGrid");
    if (grid && !grid.querySelector(".chip-strip")) {
      var readMap = {};
    try {
      readMap = JSON.parse(localStorage.getItem("quranRead") || "{}") || {};
    } catch (e) { readMap = {}; }

    /* tallies per surah; async audio.json fetch only when a count is missing from cache */
    var tally = {};
    Object.keys(readMap).forEach(function (k) {
      var p = k.split(":");
      if (p.length !== 2) return;
      tally[p[0]] = (tally[p[0]] || 0) + 1;
    });

    function stripFor(n, pct) {
      var s = document.createElement("span");
      s.className = "chip-strip";
      s.setAttribute("aria-hidden", "true");
      var f = document.createElement("span");
      f.className = "chip-strip-fill";
      f.style.width = (pct * 100).toFixed(1) + "%";
      s.appendChild(f);
      return s;
    }

    function decorate(chip, n, total) {
      if (!chip || chip.querySelector(".chip-strip")) return;
      var done = tally[n] || 0;
      if (!total || !done) return;
      chip.appendChild(stripFor(n, Math.min(1, done / total)));
    }

    var chips = grid.querySelectorAll(".chip");
    [].forEach.call(chips, function (chip) {
      var m = (chip.getAttribute("href") || "").match(/\/(\d+)\.html/);
      if (!m) return;
      decorate(chip, m[1], null);
    });

    {
      /* locate base from a known asset script; else relative guess */
      var base = "assets/data/audio.json";
      var own = document.querySelector('script[src$="chapters.js"]');
      if (own) base = own.getAttribute("src").replace(/chapters\.js$/, "audio.json");
      fetch(base).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
        if (!d || !Array.isArray(d.counts)) return;
        [].forEach.call(chips, function (chip) {
          var m = (chip.getAttribute("href") || "").match(/\/(\d+)\.html/);
          if (!m) return;
          decorate(chip, m[1], d.counts[Math.max(0, parseInt(m[1], 10) - 1)]);
        });
      }).catch(function () {});
    }
  }
})();
