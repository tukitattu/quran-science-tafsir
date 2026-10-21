/* notes.js — per-ayah notes, highlights + reading progress (localStorage, arabic pages) */
(function () {
  "use strict";
  var body = document.body;
  if (!body || !body.dataset.surah) return;      // arabic reading pages only
  if (window.__quranNotes) return;
  window.__quranNotes = true;

  var SURAH = parseInt(body.dataset.surah, 10);
  var LS = {
    notes: "quranNotes",
    hl: "quranHighlights",
    read: "quranRead"
  };
  var readAll = load(LS.read, {});
  var readN = [7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128, 111, 110, 98, 135, 112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73, 54, 45, 83, 182, 88, 75, 85, 54, 53, 89, 59, 37, 35, 38, 29, 18, 45, 60, 49, 62, 55, 78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12, 12, 30, 52, 52, 44, 28, 28, 20, 56, 40, 31, 50, 40, 46, 42, 29, 19, 36, 25, 22, 17, 19, 26, 30, 20, 15, 21, 11, 8, 8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6];
  var TOTAL = readN[SURAH - 1] || 0;

  function load(k, dflt) {
    try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? dflt : v; }
    catch (e) { return dflt; }
  }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  /* keyed store: {"1:1": note, ...} */
  var notes = load(LS.notes, {});
  var hl = load(LS.hl, {});

  function key(a) { return SURAH + ":" + a; }

  /* repaint every ayah row from current stores (used after import) */
  function applyState() {
    document.querySelectorAll(".ayah").forEach(function (ayahEl) {
      var m = /a(\d+)$/.exec(ayahEl.id || "");
      if (!m) return;
      var a = parseInt(m[1], 10);
      ayahEl.classList.toggle("done", !!readAll[key(a)]);
      paint(ayahEl, a);
    });
  }

  /* ---------- per-ayah control buttons ---------- */
  function makeBtn(cls, label, txt, onTap) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "ayah-ctl " + cls;
    b.setAttribute("aria-label", label);
    b.title = label;
    b.textContent = txt;
    b.addEventListener("click", onTap);
    b.addEventListener("click", function (e) { e.stopPropagation(); });
    return b;
  }

  function paint(ayahEl, a) {
    var k = key(a);
    ayahEl.classList.toggle("hl", !!hl[k]);
    var num = ayahEl.querySelector(".ayah-num");
    if (num) num.classList.toggle("read", !!readAll[k]);
  }

  function updatePill() {
    var done = 0;
    for (var a = 1; a <= TOTAL; a++) if (readAll[key(a)]) done++;
    var pill = document.getElementById("readPill");
    if (pill && TOTAL) {
      pill.textContent = "✓ " + done + "/" + TOTAL;
      pill.title = "Ayahs marked as read in this surah";
      var pct = done / TOTAL;
      var fill = document.getElementById("readPillFill");
      if (fill) fill.style.width = (pct * 100).toFixed(1) + "%";
    }
  }

  /* ---------- note modal ---------- */
  var modal = null, modalTA = null, modalKey = null;

  function openNote(a) {
    modalKey = key(a);
    if (!modal) {
      modal = document.createElement("div");
      modal.className = "notes-modal";
      modal.innerHTML =
        '<div class="notes-card" role="dialog" aria-label="Ayah note">' +
        '<button type="button" class="notes-x" aria-label="Close">✕</button>' +
        '<h3 data-note-title>ملاحظة · Note</h3>' +
        '<textarea rows="6" placeholder="اكتب ملاحظتك… / Write your note…"></textarea>' +
        '<div class="notes-row">' +
        '<button type="button" class="notes-save">Save · حفظ</button>' +
        '<button type="button" class="notes-del">Delete · حذف</button>' +
        "</div>" +
        '<div class="notes-io">' +
        '<button type="button" class="notes-export" title="Download all notes, highlights and read marks as a file">⇩ Export</button>' +
        '<label class="notes-import" title="Restore from an exported file">⇧ Import<input type="file" accept="application/json,.json" hidden></label>' +
        "</div></div>";
      document.body.appendChild(modal);
      modalTA = modal.querySelector("textarea");
      modal.querySelector(".notes-x").addEventListener("click", closeModal);
      modal.querySelector(".notes-save").addEventListener("click", function () {
        var v = modalTA.value.trim();
        if (v) notes[modalKey] = v; else delete notes[modalKey];
        save(LS.notes, notes);
        closeModal();
      });
      modal.querySelector(".notes-del").addEventListener("click", function () {
        delete notes[modalKey];
        save(LS.notes, notes);
        closeModal();
      });
      modal.addEventListener("click", function (e) { if (e.target === modal) closeModal(); });
      modal.querySelector(".notes-export").addEventListener("click", function () {
        var payload = { ver: 1, exported: new Date().toISOString(), notes: notes, highlights: hl, read: readAll };
        var blob = new Blob([JSON.stringify(payload, null, 1)], { type: "application/json" });
        var a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "quran-notes.json";
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
      });
      modal.querySelector(".notes-import input").addEventListener("change", function (e) {
        var f = e.target.files && e.target.files[0];
        if (!f) return;
        var rd = new FileReader();
        rd.onload = function () {
          try {
            var d = JSON.parse(rd.result || "{}");
            if (d.notes && typeof d.notes === "object") { notes = Object.assign(notes, d.notes); save(LS.notes, notes); }
            if (d.highlights && typeof d.highlights === "object") { hl = Object.assign(hl, d.highlights); save(LS.hl, hl); }
            if (d.read && typeof d.read === "object") { readAll = Object.assign(readAll, d.read); save(LS.read, readAll); }
            notes = load(LS.notes, {}); hl = load(LS.hl, {}); readAll = load(LS.read, {});
            applyState();
            updatePill();
          } catch (err) {
            window.alert("Could not import: invalid file.");
          }
        };
        rd.readAsText(f);
        e.target.value = "";
      });
    }
    modal.querySelector("h3").textContent = "Note · " + modalKey;
    modalTA.value = notes[modalKey] || "";
    modal.classList.add("open");
  }
  function closeModal() { if (modal) modal.classList.remove("open"); }

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeModal();
  });

  /* ---------- build the UI ---------- */
  var list = document.querySelector(".ayah-list");
  if (list) list.classList.add("note-ready");

  document.querySelectorAll(".ayah").forEach(function (ayahEl) {
    var m = /a(\d+)$/.exec(ayahEl.id || "");
    if (!m) return;
    var a = parseInt(m[1], 10);

    var bar = document.createElement("div");
    bar.className = "ayah-actions";
    bar.appendChild(makeBtn("n-note", "Add / edit note for this ayah", "✎", function () { openNote(a); }));
    bar.appendChild(makeBtn("n-hl", "Toggle highlight", "‖", function () {
      var k = key(a);
      if (hl[k]) delete hl[k]; else hl[k] = 1;
      save(LS.hl, hl);
      paint(ayahEl, a);
    }));
    bar.appendChild(makeBtn("n-read", "Mark as read / unmark", "✓", function () {
      var k = key(a);
      if (readAll[k]) { delete readAll[k]; ayahEl.classList.remove("done"); }
      else { readAll[k] = 1; ayahEl.classList.add("done"); }
      save(LS.read, readAll);
      paint(ayahEl, a);
      updatePill();
    }));
    ayahEl.appendChild(bar);

    if (readAll[key(a)]) ayahEl.classList.add("done");
    paint(ayahEl, a);
  });

  /* ---------- read-progress pill above the list ---------- */
  if (TOTAL) {
    var head = document.querySelector(".chapter-head, .ayah-list");
    var pill = document.createElement("div");
    pill.id = "readPill";
    pill.className = "read-pill";
    pill.setAttribute("role", "status");
    pill.innerHTML = '<span data-label>✓ 0/' + TOTAL + "</span>" +
      '<span class="read-pill-track"><span class="read-pill-fill" id="readPillFill"></span></span>';
    if (head && head.classList.contains("chapter-head")) head.appendChild(pill);
    else if (head) head.insertBefore(pill, head.firstChild);
    updatePill();
  }
})();
