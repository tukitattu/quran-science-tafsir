/* Tilawah player — streams free CDN audio (never bundled).
 * Loaded on demand (app.js) or statically (arabic pages).
 * API: window.QuranPlayer.{playSurah,playAyah,playWord,toggle,stop,next,prev}
 */
(function () {
  "use strict";
  var src = (document.currentScript && document.currentScript.src) || "";
  var BASE = src.replace(/assets\/js\/player\.js.*$/, "");

  var M = null;          // audio.json manifest
  var loading = null;
  var audio = null;
  var bar = null;
  var S = { mode: null, surah: 0, ayah: 0, reciter: 0, playing: false, triedFallback: false };

  function rel(u) { return BASE + u; }
  function counts(s) { return M.counts[s - 1]; }
  function globalOf(s, a) { return M.offsets[s - 1] + a; }
  function reciter() { return M.reciters[S.reciter] || M.reciters[0]; }

  function ensure() {
    if (M) return Promise.resolve(M);
    if (!loading) {
      loading = fetch(rel("assets/data/audio.json"))
        .then(function (r) { if (!r.ok) throw new Error("audio.json " + r.status); return r.json(); })
        .then(function (m) { M = m; return m; });
    }
    return loading;
  }

  function getAudio() {
    if (audio) return audio;
    audio = new Audio();
    audio.preload = "none";
    audio.addEventListener("ended", function () {
      if (S.mode === "ayah") {
        if (S.ayah < counts(S.surah)) { S.ayah++; playCurrent(); return; }
        stop(); return;
      }
      stop();
    });
    audio.addEventListener("playing", function () { S.playing = true; render(); });
    audio.addEventListener("pause", function () { S.playing = false; render(); });
    audio.addEventListener("error", function () {
      var r = reciter();
      if (!S.triedFallback && r.fallback && S.mode === "ayah") {
        S.triedFallback = true;
        var u = r.fallback.replace(/\{padded\}/, pad(S.surah) + pad(S.ayah));
        audio.src = u; audio.play().catch(function () { stop(); });
        return;
      }
      // give up on this file: skip forward in a chain, else stop
      if (S.mode === "ayah" && S.ayah < counts(S.surah)) { S.ayah++; S.triedFallback = false; playCurrent(); }
      else stop();
    });
    return audio;
  }
  function pad(n) { return ("00" + n).slice(-3); }

  function ayahUrl(s, a) {
    var r = reciter(), g = globalOf(s, a);
    if (r.ayah) return r.ayah.replace("{g}", g);
    if (r.fallback) return r.fallback.replace(/\{padded\}/, pad(s) + pad(a));
    return "";
  }

  function playCurrent() {
    var a = getAudio();
    S.triedFallback = false;
    var u = S.mode === "surah-full"
      ? M.surah.replace("{s}", S.surah)
      : ayahUrl(S.surah, S.ayah);
    if (!u) { stop(); return; }
    a.src = u;
    a.play().catch(function () { /* autoplay blocked until user gesture */ });
    active();
    render();
  }

  function active() {
    try {
      document.dispatchEvent(new CustomEvent("quran-ayah-active",
        { detail: { surah: S.surah, ayah: S.ayah, mode: S.mode } }));
    } catch (e) { /* no CustomEvent on ancient browsers */ }
  }

  function loadSafely(fn) {
    ensure().then(fn).catch(function (e) {
      console.warn("audio manifest:", e);
      var l = document.getElementById("qp-label");
      if (l) l.textContent = "audio unavailable";
    });
  }

  function playSurah(s) {
    loadSafely(function () {
      stop0();
      S.surah = s; S.ayah = 1;
      S.mode = reciter().surah ? "surah-full" : "ayah";
      playCurrent();
    });
  }
  function playAyah(s, a) {
    loadSafely(function () {
      stop0();
      S.surah = s; S.ayah = a; S.mode = "ayah";
      playCurrent();
    });
  }
  function playWord(u) {
    loadSafely(function () {
      stop0();
      var a = getAudio();
      S.mode = "word"; S.surah = 0; S.ayah = 0;
      a.src = u.indexOf("http") === 0 ? u : rel(u);
      a.play().catch(function () {});
      render();
    });
  }
  function stop0() { if (audio) { audio.pause(); audio.removeAttribute("src"); audio.load(); } }
  function stop() { S.mode = null; S.playing = false; stop0(); render(); }
  function toggle() {
    if (!S.mode) { loadSafely(function () { /* nothing to resume */ }); return; }
    var a = getAudio();
    if (S.playing) a.pause();
    else { if (!a.src) playCurrent(); else a.play().catch(function () {}); }
  }
  function step(d) {
    if (S.mode !== "ayah") return;
    loadSafely(function () {
      var n = S.ayah + d;
      if (n < 1) n = 1;
      if (n > counts(S.surah)) n = counts(S.surah);
      if (n === S.ayah) return;
      S.ayah = n; playCurrent();
    });
  }
  function cycleReciter() {
    loadSafely(function () {
      S.reciter = (S.reciter + 1) % M.reciters.length;
      try { localStorage.setItem("tafsir-reciter", S.reciter); } catch (e) {}
      if (S.mode === "ayah") playCurrent();
      else if (S.mode === "surah-full") playSurah(S.surah);
      render();
    });
  }

  /* ---------- UI ---------- */
  function esc(t) { var d = document.createElement("div"); d.textContent = t == null ? "" : t; return d.innerHTML; }
  function label() {
    if (!S.mode) return "Tilawah";
    if (S.mode === "word") return "Word";
    var name = surahName(S.surah);
    if (S.mode === "surah-full") return "#" + S.surah + (name ? " " + name : "");
    return "#" + S.surah + ":" + S.ayah + (name ? " " + name : "");
  }
  function surahName(s) {
    try {
      if (window.QURAN && QURAN.chapters) return (QURAN.chapters[s - 1] || {}).ar || "";
    } catch (e) {}
    return "";
  }

  function buildBar() {
    if (bar) return bar;
    bar = document.createElement("div");
    bar.id = "qp-bar";
    bar.innerHTML =
      '<button id="qp-prev" title="Previous ayah" aria-label="Previous ayah">⏮</button>' +
      '<button id="qp-toggle" title="Play / pause" aria-label="Play or pause">▶</button>' +
      '<button id="qp-next" title="Next ayah" aria-label="Next ayah">⏭</button>' +
      '<span id="qp-label">Tilawah</span>' +
      '<button id="qp-reciter" title="Change reciter">Reciter</button>' +
      '<button id="qp-close" title="Stop" aria-label="Stop">✕</button>';
    document.body.appendChild(bar);
    bar.querySelector("#qp-toggle").addEventListener("click", toggle);
    bar.querySelector("#qp-prev").addEventListener("click", function () { step(-1); });
    bar.querySelector("#qp-next").addEventListener("click", function () { step(1); });
    bar.querySelector("#qp-reciter").addEventListener("click", cycleReciter);
    bar.querySelector("#qp-close").addEventListener("click", stop);
    return bar;
  }

  function render() {
    if (!S.mode && !bar) return;
    if (!bar && document.body) buildBar();
    if (!bar) return;
    if (!S.mode) { bar.style.display = "none"; return; } // idle after ✕ — hide
    bar.style.display = "flex";
    bar.classList.toggle("is-playing", !!S.playing);
    var t = bar.querySelector("#qp-toggle");
    t.textContent = S.playing ? "⏸" : "▶";
    var l = bar.querySelector("#qp-label");
    l.textContent = label() + (M ? " · " + reciter().en : "");
    var prev = bar.querySelector("#qp-prev"), next = bar.querySelector("#qp-next");
    var chain = S.mode === "ayah";
    prev.style.display = next.style.display = chain ? "" : "none";
  }

  /* ---------- delegation ---------- */
  document.addEventListener("click", function (e) {
    var t = e.target && e.target.closest ? e.target.closest("[data-play-surah],[data-play-ayah],[data-play-word]") : null;
    if (!t) return;
    e.preventDefault();
    if (t.hasAttribute("data-play-surah")) playSurah(+t.getAttribute("data-play-surah"));
    else if (t.hasAttribute("data-play-ayah")) {
      var v = (t.getAttribute("data-play-ayah") || "").split(":");
      playAyah(+v[0], +v[1] || 1);
    } else if (t.hasAttribute("data-play-word")) {
      playWord(t.getAttribute("data-play-word"));
    }
  });

  function init() {
    try {
      var r = parseInt(localStorage.getItem("tafsir-reciter") || "0", 10);
      if (!isNaN(r)) S.reciter = r;
    } catch (e) {}
    if (document.body) render();
    else document.addEventListener("DOMContentLoaded", render);
  }

  window.QuranPlayer = {
    playSurah: playSurah, playAyah: playAyah, playWord: playWord,
    toggle: toggle, stop: stop, next: function () { step(1); },
    prev: function () { step(-1); }, cycleReciter: cycleReciter,
    state: function () { return S; }
  };
  /* flush clicks queued before this file loaded */
  var q = window.__QuranPlayQueue;
  if (q && q.length) {
    q.forEach(function (fn) { try { fn(); } catch (e) {} });
    window.__QuranPlayQueue = [];
  }
  init();
})();
