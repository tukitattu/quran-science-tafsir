/* notes-center.js — all saved annotations across the Quran, grouped by surah */
(function () {
  "use strict";
  if (window.__notesCenter) return;
  window.__notesCenter = true;

  function lsGet(k, dflt) {
    try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? dflt : v; }
    catch (e) { return dflt; }
  }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  var NAMES = {};
  try {
    var ch = (typeof QURAN !== "undefined" && QURAN.chapters) || (window.CHAPTERS && (window.CHAPTERS.chapters || window.CHAPTERS)) || [];
    (Array.isArray(ch) ? ch : Object.values(ch)).forEach(function (c) { if (c && c.n) NAMES[c.n] = c; });
  } catch (e) {}

  function esc(t) { return String(t == null ? "" : t).replace(/[<>&"]/g, function (c) { return { "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" }[c]; }); }

  function collect() {
    var notes = lsGet("quranNotes", {}), hl = lsGet("quranHighlights", {}), read = lsGet("quranRead", {});
    var seen = {};
    function add(k, type) {
      var p = String(k).split(":");
      if (p.length !== 2) return;
      var s = parseInt(p[0], 10), a = parseInt(p[1], 10);
      if (!s || !a) return;
      seen[s] = seen[s] || {};
      seen[s][a] = seen[s][a] || { s: s, a: a, types: {} };
      seen[s][a].types[type] = type === "note" ? notes[k] : 1;
    }
    Object.keys(notes).forEach(function (k) { add(k, "note"); });
    Object.keys(hl).forEach(function (k) { add(k, "hl"); });
    Object.keys(read).forEach(function (k) { add(k, "read"); });
    return seen;
  }

  function readTotals() {
    var read = lsGet("quranRead", {});
    var t = {};
    Object.keys(read).forEach(function (k) {
      var p = k.split(":");
      t[parseInt(p[0], 10)] = (t[parseInt(p[0], 10)] || 0) + 1;
    });
    return t;
  }

  function render() {
    var host = document.getElementById("notesCenter");
    if (!host) return;
    var data = collect();
    var surahs = Object.keys(data).map(Number).sort(function (x, y) { return x - y; });
    if (!surahs.length) {
      host.innerHTML =
        '<div class="notes-empty">' +
        '<p><b>Nothing saved yet.</b></p>' +
        '<p>Open any surah reading page, tap ✎ beside an ayah to write a note, ‖ to highlight, or ✓ to mark it read.</p>' +
        '<a class="btn" href="chapters/1/arabic.html">Start with Al-Fatihah →</a>' +
        "</div>";
      return;
    }
    var totals = readTotals();
    var html = '<p class="notes-stat">' + surahs.length + " surah(s) touched · most recent first isn't tracked — ordered by surah number</p>";
    surahs.forEach(function (n) {
      var c = NAMES[n] || {};
      var row = data[n];
      var ids = Object.keys(row).map(Number).sort(function (x, y) { return x - y; });
      var meta = String(totals[n] || 0) + " read";
      html +=
        '<details class="note-surah"><summary>' +
        '<span class="ns-num">' + n + "</span>" +
        '<span class="ns-name"><b dir="rtl" lang="ar">' + esc(c.ar || "") + "</b> " + esc(c.en || ("Surah " + n)) +
        '<span class="ns-meta">' + esc(meta) + "</span></span>" +
        "</summary><div class=\"ns-list\">";
      ids.forEach(function (a) {
        var it = row[a];
        var badges = [];
        if (it.types.note) badges.push('<span class="nb nb-note">✎ note</span>');
        if (it.types.hl) badges.push('<span class="nb nb-hl">‖ highlight</span>');
        if (it.types.read) badges.push('<span class="nb nb-read">✓ read</span>');
        var noteText = it.types.note ? '<span class="ns-note">' + esc(it.types.note) + "</span>" : "";
        html +=
          '<a class="ns-item" href="chapters/' + n + "/arabic.html#a" + a + '">' +
          "<b>" + n + ":" + a + "</b> " + noteText + '<span class="ns-badges">' + badges.join(" ") + "</span></a>";
      });
      html += "</div></details>";
    });
    host.innerHTML = html;
  }

  /* actions */
  var ex = document.getElementById("ncExport");
  if (ex) ex.addEventListener("click", function () {
    var payload = { ver: 1, exported: new Date().toISOString(), notes: lsGet("quranNotes", {}), highlights: lsGet("quranHighlights", {}), read: lsGet("quranRead", {}) };
    var blob = new Blob([JSON.stringify(payload, null, 1)], { type: "application/json" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "quran-notes.json";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
  });
  var im = document.getElementById("ncImport");
  if (im) im.addEventListener("change", function (e) {
    var f = e.target.files && e.target.files[0];
    if (!f) return;
    var rd = new FileReader();
    rd.onload = function () {
      try {
        var d = JSON.parse(rd.result || "{}");
        if (d.notes && typeof d.notes === "object") lsSet("quranNotes", Object.assign(lsGet("quranNotes", {}), d.notes));
        if (d.highlights && typeof d.highlights === "object") lsSet("quranHighlights", Object.assign(lsGet("quranHighlights", {}), d.highlights));
        if (d.read && typeof d.read === "object") lsSet("quranRead", Object.assign(lsGet("quranRead", {}), d.read));
        render();
      } catch (err) { window.alert("Could not import: invalid file."); }
    };
    rd.readAsText(f);
    e.target.value = "";
  });
  var clear = document.getElementById("ncClear");
  if (clear) clear.addEventListener("click", function () {
    if (!window.confirm("Delete ALL notes, highlights and read marks on this device? Export a backup first — this cannot be undone.")) return;
    lsSet("quranNotes", {}); lsSet("quranHighlights", {}); lsSet("quranRead", {});
    render();
  });

  render();
})();
