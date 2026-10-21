/* rootspanel.js — "Roots & deep words of this surah" panel (arabic reading pages).
   Lazy: surah_knowledge.js (root studies) + words_export.json load on first open. */
(function () {
  "use strict";
  var body = document.body;
  if (!body || !body.dataset.surah) return;
  if (window.__rootsPanel) return;
  window.__rootsPanel = true;

  var SURAH = parseInt(body.dataset.surah, 10);
  var list = document.querySelector(".ayah-list");
  if (!list) return;

  var src = (document.currentScript && document.currentScript.src) || "";
  var BASE = src.replace(/assets\/js\/rootspanel\.js.*$/, "");

  var panel = document.createElement("details");
  panel.className = "roots-panel";
  panel.innerHTML =
    '<summary><b>Roots &amp; deep words of this surah</b> <span class="roots-hint">– tap to open</span></summary>' +
    '<div class="roots-body" aria-live="polite"><div class="roots-loading">Loading…</div></div>';

  var before = list;
  list.parentNode.insertBefore(panel, before);

  var loaded = null;
  function loadAll() {
    if (loaded && loaded.then) return loaded;
    loaded = Promise.all([
      new Promise(function (res) {
        if (window.SURAH_KNOWLEDGE) return res(window.SURAH_KNOWLEDGE);
        var s = document.createElement("script");
        s.src = BASE + "assets/data/surah_knowledge.js";
        s.onload = function () { res(window.SURAH_KNOWLEDGE || {}); };
        s.onerror = function () { res({}); };
        document.head.appendChild(s);
      }),
      fetch(BASE + "assets/data/words_export.json")
        .then(function (r) { return r.ok ? r.json() : []; })
        .catch(function () { return []; })
    ]).then(function (p) { loaded = { sk: p[0], deep: p[1] }; return loaded; });
    return loaded;
  }

  function esc(t) { var d = document.createElement("div"); d.textContent = t == null ? "" : t; return d.innerHTML; }

  function render() {
    var b = panel.querySelector(".roots-body");
    return loadAll().then(function (d) {
      var sk = (d.sk || {})[SURAH] || {};
      var roots = sk.roots || [];
      var deep = (d.deep || []).filter(function (x) { return x.surah === SURAH; });
      var html = "";

      if (roots.length) {
        html += '<h4>Key roots</h4><div class="root-grid">';
        roots.forEach(function (r) {
          html +=
            '<div class="root-card">' +
            '<div class="root-word" dir="rtl" lang="ar">' + esc(r.ar) + "</div>" +
            (r.root ? '<div class="root-letters" dir="rtl" lang="ar">' + esc(r.root) + "</div>" : "") +
            (r.tr ? '<div class="root-tr">' + esc(r.tr) + "</div>" : "") +
            (r.en ? "<div>" + esc(r.en) + "</div>" : "") +
            (r.bn ? '<div class="root-bn">' + esc(r.bn) + "</div>" : "") +
            (r.ex ? '<div class="root-ex">' + esc(r.ex) + "</div>" : "") +
            "</div>";
        });
        html += "</div>";
      }

      if (deep.length) {
        html += '<h4>Deep word studies <span class="roots-count">' + deep.length + "</span></h4>" + '<div class="root-grid">';
        deep.forEach(function (x) {
          var ra = x.ra || {};
          html +=
            '<div class="root-card">' +
            '<div class="root-word" dir="rtl" lang="ar">' + esc(x.w) + "</div>" +
            (x.root ? '<div class="root-letters" dir="rtl" lang="ar">' + esc(x.root) + "</div>" : "") +
            (ra.pattern || x.form ? '<div class="root-tr">' + esc(ra.pattern || x.form) + "</div>" : "") +
            (x.en ? "<div>" + esc(x.en) + "</div>" : "") +
            (x.bn ? '<div class="root-bn">' + esc(x.bn) + "</div>" : "") +
            "</div>";
        });
        html += "</div>";
      }

      if (!html) {
        html = '<div class="roots-loading">No curated root study for this surah yet — corpus links in the word popovers cover every word.</div>';
      }
      b.innerHTML = html;
    });
  }

  panel.addEventListener("toggle", function () {
    if (panel.open && panel.querySelector(".roots-loading")) render();
  });
})();
