/* Ayah-by-ayah translations for chapter pages.
 * Loads assets/data/tr/{surah}.json lazily (7 editions + transliteration +
 * Bangla pronunciation + footnotes + classical surah introduction).
 * Source data: eQuran / engineersTech public editions (Saheeh International,
 * Islamic Foundation Bangladesh, Taisirul Quran, Al-Bayan, Mujibur Rahman,
 * Muhiuddin Khan, Zahurul Haque).
 */
(function () {
  var m = (location.pathname.match(/chapters\/(\d+)\.html/) || [])[1]
    || (location.pathname.match(/\/(\d+)\.html$/) || [])[1];
  var surah = parseInt(m || "0", 10);
  if (!surah) return;

  var SOURCE_LABELS = {
    en: "English · Saheeh International",
    bq: "বাংলা · ইসলামিক ফাউন্ডেশন",
    taisir: "বাংলা · তাইসীরুল কুরআন",
    bayan: "বাংলা · আল-বায়ান",
    mujib: "বাংলা · শাইখ মুজিবুর রহমান",
    khan: "বাংলা · মুহিউদ্দীন খান",
    hoque: "বাংলা · জহুরুল হক"
  };
  var ORDER = ["en", "bq", "taisir", "bayan", "mujib", "khan", "hoque"];
  var current = "en";
  var DATA = null;
  var box = null;

  function esc(s) {
    return String(s == null ? "" : s).replace(/[<>&"]/g, function (c) {
      return { "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" }[c];
    });
  }
  // Bundled data is third-party sourced: keep only harmless inline markup.
  function sanitize(html) {
    var tpl = document.createElement("template");
    tpl.innerHTML = String(html == null ? "" : html);
    tpl.content
      .querySelectorAll("script,style,iframe,object,embed,img,svg,link,meta,form,input")
      .forEach(function (n) {
        n.remove();
      });
    tpl.content.querySelectorAll("*").forEach(function (n) {
      if (
        ["B", "STRONG", "I", "EM", "BR", "P", "DIV", "SPAN", "UL", "OL", "LI", "SUP", "SUB"].indexOf(
          n.tagName
        ) < 0
      ) {
        n.replaceWith.apply(n, Array.prototype.slice.call(n.childNodes));
      } else {
        Array.prototype.slice.call(n.attributes).forEach(function (a) {
          n.removeAttribute(a.name);
        });
      }
    });
    return tpl.innerHTML;
  }

  function arNum(n) {
    return String(n).replace(/\d/g, function (d) { return "٠١٢٣٤٥٦٧٨٩"[+d]; });
  }

  function shell() {
    var wrap = document.querySelector(".kb-wrap");
    if (!wrap || document.getElementById("kb-translations-" + surah)) return;
    var d = document.createElement("details");
    d.id = "kb-translations-" + surah;
    d.innerHTML =
      '<summary><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d4af37" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><path d="M9 7h7M9 11h7M9 15h4"/></svg> Ayah-by-Ayah Translations — 7 editions · آية آية</summary>' +
      '<div class="kb-body" id="tr-body-' + surah + '"><div class="skeleton skeleton-text" style="width:90%"></div><div class="skeleton skeleton-text" style="width:70%"></div></div>';
    wrap.insertBefore(d, wrap.firstChild);
    box = d.querySelector("#tr-body-" + surah);
    d.addEventListener("toggle", function () {
      if (d.open && !DATA) load();
    });
    // if opened by hash/deep link
    if (d.open) load();
  }

  function load() {
    box.innerHTML = '<p class="small">Loading translations…</p>';
    fetch("../assets/data/tr/" + surah + ".json")
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (d) { DATA = d; render(); })
      .catch(function () {
        box.innerHTML = '<p class="small">Translations could not load — check your connection and reload.</p>';
      });
  }

  function render() {
    var head =
      '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">' +
      ORDER.map(function (id) {
        return '<button class="btn ghost tr-src" data-id="' + id + '" style="font-size:0.78rem;padding:4px 9px;' +
          (id === current ? "border-color:#d4af37;color:#d4af37" : "") + '">' + esc(SOURCE_LABELS[id]) + "</button>";
      }).join("") +
      "</div>";
    var intro = DATA.intro
      ? '<details style="margin:8px 0 14px"><summary style="cursor:pointer;color:var(--accent2);font-weight:700">সূরার পরিচিতি — Classical introduction</summary>' +
        '<div class="small" style="margin-top:6px;line-height:1.8">' + sanitize(DATA.intro) + "</div></details>"
      : "";
    var list = DATA.ayahs.map(function (a) {
      var fns = a.fn ? Object.keys(a.fn).map(function (k) {
        return '<div class="small" style="margin-top:4px"><b>[' + esc(k) + "]</b> " + sanitize(a.fn[k]) + "</div>";
      }).join("") : "";
      return '<div class="tr-ayah" style="border-top:1px solid var(--border);padding:12px 0">' +
        '<div style="display:flex;gap:8px;align-items:baseline"><span class="w-chip gold">' + arNum(a.a) + "</span>" +
        '<div dir="rtl" lang="ar" class="arabic-text" style="font-size:1.35rem;line-height:2;color:var(--accent2);flex:1">' + esc(a.ar || "") + "</div></div>" +
        (a.tr ? '<div class="small" style="color:var(--muted);font-style:italic">' + esc(a.tr) + "</div>" : "") +
        (a.uc ? '<div class="small bn-text" style="color:var(--muted)">উচ্চারণ: ' + esc(a.uc) + "</div>" : "") +
        '<div style="margin-top:6px;line-height:1.7">' + esc(a[current] || "") + "</div>" +
        (fns ? '<details style="margin-top:6px"><summary class="small" style="cursor:pointer;color:var(--accent2)">Footnotes / তাফসীর টীকা</summary>' + fns + "</details>" : "") +
        "</div>";
    }).join("");
    box.innerHTML = head + intro + list;
    box.querySelectorAll(".tr-src").forEach(function (b) {
      b.addEventListener("click", function () {
        current = b.dataset.id;
        render();
      });
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", shell);
  else shell();
  // pages inject .kb-wrap late; retry once
  setTimeout(shell, 900);
})();
