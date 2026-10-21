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

/* ---------- 6. Bottom navigation + Settings drawer (Phase 1+5) ---------- */
(function () {
  "use strict";
  if (window.__uxNav) return;
  window.__uxNav = true;

  var dir = document.documentElement.getAttribute("dir") || "ltr";
  var AR = dir === "rtl";
  var L = AR
    ? { home: "الرئيسية", search: "البحث", notes: "ملاحظاتي", settings: "إعدادات", settingsTitle: "الإعدادات", lang: "اللغة", all: "الكل", en: "الإنجليزية", bn: "البنغالية", ar: "العربية", reciter: "القارئ", reciterNext: "تغيير القارئ", textSize: "حجم النص العربي", annotations: "الملحقات", exportAll: "تصدير الملاحقات", importAll: "استيراد", close: "إغلاق", done: "تم" }
    : { home: "Home", search: "Search", notes: "My Notes", settings: "Settings", settingsTitle: "Settings", lang: "Language", all: "All", en: "English", bn: "বাংলা", ar: "العربية", reciter: "Reciter", reciterNext: "Change reciter", textSize: "Arabic text size", annotations: "Annotations", exportAll: "Export annotations", importAll: "Import", close: "Close", done: "Done" };

  var src = (document.currentScript && document.currentScript.src) || "";
  var BASE = (src.replace(/assets\/js\/ux-mobile\.js.*$/, "")).replace(/\/+$/, "/");
  if (!/\/$/.test(BASE)) BASE += "/";

  /* path check: which tool page are we on */
  var path = location.pathname.replace(/[?#].*$/, "");
  function endsWith(f) { var i = path.lastIndexOf("/" + f); return i > -1 && i === path.length - f.length - 1; }
  var here = endsWith("index.html") ? "home" : endsWith("search.html") ? "search" : endsWith("notes.html") ? "notes" : null;

  function mk(href, svgText, label, cls) {
    var a = document.createElement("a");
    if (cls === "btn") {
      a = document.createElement("button");
      a.type = "button";
    } else {
      a.href = href;
    }
    a.className = "bnav-item" + (here === cls ? " on" : "");
    a.innerHTML = svgText + "<span>" + label + "</span>";
    a.setAttribute("aria-label", label);
    if (here === cls) a.setAttribute("aria-current", "page");
    return a;
  }

  var IC = {
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>',
    notes: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 4h11l3 3v13H5z"/><path d="M9 10h6M9 14h6"/></svg>',
    settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1"/></svg>'
  };

  var nav = document.createElement("nav");
  nav.className = "bnav";
  nav.setAttribute("aria-label", "Primary");
  nav.appendChild(mk(BASE + "index.html", IC.home, L.home, "home"));
  nav.appendChild(mk(BASE + "search.html", IC.search, L.search, "search"));
  nav.appendChild(mk(BASE + "notes.html", IC.notes, L.notes, "notes"));
  var setBtn = mk(null, IC.settings, L.settings, "btn");
  nav.appendChild(setBtn);
  document.body.appendChild(nav);

  /* --------- settings drawer --------- */
  var backdrop = document.createElement("div");
  backdrop.className = "sheet-backdrop";
  var sheet = document.createElement("div");
  sheet.className = "sheet";
  sheet.setAttribute("role", "dialog");
  sheet.setAttribute("aria-modal", "true");
  sheet.setAttribute("aria-label", L.settingsTitle);
  sheet.innerHTML =
    '<div class="sheet-head"><b>' + L.settingsTitle + '</b><button type="button" class="sheet-x" aria-label="' + L.close + '">✕</button></div>' +
    '<div class="sheet-body">' +
    '<p class="set-label">' + L.lang + "</p>" +
    '<div class="set-lang">' +
    '<button type="button" data-lang="all">' + L.all + "</button>" +
    '<button type="button" data-lang="en">' + L.en + "</button>" +
    '<button type="button" data-lang="bn">' + L.bn + "</button>" +
    '<button type="button" data-lang="ar">' + L.ar + "</button>" +
    "</div>" +
    '<p class="set-label">' + L.reciter + "</p>" +
    '<button type="button" class="set-btn" id="setReciter" title="' + L.reciterNext + '">' + L.reciterNext + "</button>" +
    '<p class="set-label" id="reciterName"></p>' +
    '<p class="set-label">' + L.textSize + "</p>" +
    '<input type="range" id="textSize" min="1.0" max="1.6" step="0.05" value="1.0" aria-label="' + L.textSize + '">' +
    '<p class="set-label">' + L.annotations + "</p>" +
    '<div class="set-io">' +
    '<button type="button" class="set-btn" id="setExport">' + L.exportAll + "</button>" +
    '<label class="set-btn set-file-label">' + L.importAll + '<input type="file" id="setImport" accept="application/json,.json" hidden></label>' +
    "</div>" +
    "</div>";
  document.body.appendChild(backdrop);
  document.body.appendChild(sheet);

  function openSheet() {
    backdrop.classList.add("open");
    sheet.classList.add("open");
    paintLang();
    paintTextSize();
    paintReciter();
    setBtn.setAttribute("aria-expanded", "true");
    (sheet.querySelector(".sheet-x")).focus();
  }
  function closeSheet() {
    backdrop.classList.remove("open");
    sheet.classList.remove("open");
    setBtn.setAttribute("aria-expanded", "false");
  }
  setBtn.addEventListener("click", openSheet);
  sheet.querySelector(".sheet-x").addEventListener("click", closeSheet);
  backdrop.addEventListener("click", closeSheet);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeSheet(); });

  /* language */
  function paintLang() {
    var cur = null;
    try { cur = localStorage.getItem("quran-lang") || "all"; } catch (e) {}
    sheet.querySelectorAll(".set-lang button").forEach(function (b) {
      b.classList.toggle("on", b.dataset.lang === cur);
    });
  }
  sheet.querySelectorAll(".set-lang button").forEach(function (b) {
    b.addEventListener("click", function () {
      var l = b.dataset.lang;
      try { localStorage.setItem("quran-lang", l); } catch (e) {}
      paintLang();
      if (typeof window.setLang === "function") {
        try { window.setLang(l, false); } catch (e) {}
      } else {
        location.reload();
      }
    });
  });

  /* reciter */
  function paintReciter() {
    fetch(BASE + "assets/data/audio.json").then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
      if (!d || !Array.isArray(d.reciters)) return;
      var cur = 0;
      try { cur = parseInt(localStorage.getItem("tafsir-reciter") || "0", 10) || 0; } catch (e) {}
      cur = Math.max(0, Math.min(d.reciters.length - 1, cur));
      var r = d.reciters[cur] || {};
      var nameEl = sheet.querySelector("#reciterName");
      if (nameEl) nameEl.textContent = (dir === "rtl" ? (r.bn || r.en) : r.en) + " (" + (cur + 1) + "/" + d.reciters.length + ")";
    }).catch(function () {});
  }
  sheet.querySelector("#setReciter").addEventListener("click", function () {
    fetch(BASE + "assets/data/audio.json").then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
      if (!d || !Array.isArray(d.reciters) || d.reciters.length < 2) return;
      var cur = 0;
      try { cur = parseInt(localStorage.getItem("tafsir-reciter") || "0", 10) || 0; } catch (e) {}
      cur = (cur + 1) % d.reciters.length;
      try { localStorage.setItem("tafsir-reciter", String(cur)); } catch (e) {}
      paintReciter();
    }).catch(function () {});
  });

  /* text size scale for arabic reading pages */
  function paintTextSize() {
    var v = 1;
    try { v = parseFloat(localStorage.getItem("tafsir-text-scale") || "1") || 1; } catch (e) {}
    sheet.querySelector("#textSize").value = String(v);
    applyTextScale(v);
  }
  function applyTextScale(v) {
    var rootStyle = document.documentElement.style;
    if (document.querySelector(".ayah .ar")) rootStyle.setProperty("--text-scale", v);
  }
  sheet.querySelector("#textSize").addEventListener("input", function (e) {
    var v = parseFloat(e.target.value) || 1;
    applyTextScale(v);
    try { localStorage.setItem("tafsir-text-scale", String(v)); } catch (err) {}
  });

  /* annotations export/import (same payload contract as notes.js) */
  function lsGet(k, dflt) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? dflt : v; } catch (e) { return dflt; } }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  sheet.querySelector("#setExport").addEventListener("click", function () {
    var payload = { ver: 1, exported: new Date().toISOString(), notes: lsGet("quranNotes", {}), highlights: lsGet("quranHighlights", {}), read: lsGet("quranRead", {}), reciter: lsGet("tafsir-reciter", 0) };
    var blob = new Blob([JSON.stringify(payload, null, 1)], { type: "application/json" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "quran-notes.json";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
  });
  sheet.querySelector("#setImport").addEventListener("change", function (e) {
    var f = e.target.files && e.target.files[0];
    if (!f) return;
    var rd = new FileReader();
    rd.onload = function () {
      try {
        var d = JSON.parse(rd.result || "{}");
        ["notes", "highlights", "read"].forEach(function (store) {
          var key = "quranNotes", alt = "quranHighlights", rx = "quranRead";
          key = store === "notes" ? "quranNotes" : store === "highlights" ? "quranHighlights" : "quranRead";
          if (d[store] && typeof d[store] === "object") lsSet(key, Object.assign(lsGet(key, {}), d[store]));
        });
        location.reload();
      } catch (err) { window.alert("Could not import: invalid file."); }
    };
    rd.readAsText(f);
    e.target.value = "";
  });
})();
