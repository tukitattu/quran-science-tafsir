/* Knowledge Hub — 99 names, du'as, step-by-step guides, daily ayah/hadith,
 * topic collections. Data: assets/data/more/*.json (eQuran public dataset). */
(function () {
  var DATA = {};
  var tab = "names";
  var q = "";
  var duaCat = "";
  var topicIdx = -1;
  var root = document.getElementById("moreBody");
  var search = document.getElementById("moreSearch");
  var tabs = document.getElementById("moreTabs");

  function esc(s) {
    return String(s == null ? "" : s).replace(/[<>&"]/g, function (c) {
      return { "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" }[c];
    });
  }
  function load(name) {
    return fetch("assets/data/more/" + name + ".json")
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); });
  }
  function match(s) { return !q || String(s || "").toLowerCase().indexOf(q) >= 0; }

  function namesView() {
    var list = (DATA.names.names || []).filter(function (n) {
      return match(n.ar + " " + n.tr + " " + n.mean + " " + n.me + " " + n.desc);
    });
    if (!list.length) return '<div class="empty">No names match.</div>';
    return '<div class="names-grid">' + list.map(function (n) {
      return '<article class="name-card"><div class="ar" dir="rtl" lang="ar">' + esc(n.ar) + "</div>" +
        '<div class="tr">' + esc(n.tr) + " · " + esc(n.uc) + "</div>" +
        '<div class="me">' + esc(n.me || n.mean) + "</div>" +
        '<div class="small bn-text" style="text-align:center;color:var(--accent2)">' + esc(n.mean) + "</div>" +
        (n.desc ? '<div class="desc bn-text">' + esc(n.desc) + "</div>" : "") +
        (n.q && n.q.length ? '<div class="qrefs">' + n.q.slice(0, 4).map(function (r) {
          var s = String(r).split(":")[0];
          return '<a href="chapters/' + s + '.html">' + esc(r) + "</a>";
        }).join("") + "</div>" : "") + "</article>";
    }).join("") + "</div>";
  }

  function duasView() {
    var cats = (DATA.duas.categories || []);
    var active = cats.filter(function (c) { return c.id === duaCat; })[0];
    var shown = active ? [active] : cats;
    var chips = '<div class="dua-cats"><button data-cat="" class="' + (duaCat ? "" : "active") + '">All</button>' +
      cats.map(function (c) {
        return '<button data-cat="' + esc(c.id) + '" class="' + (duaCat === c.id ? "active" : "") + '">' + esc(c.icon || "") + " " + esc(c.cat) + "</button>";
      }).join("") + "</div>";
    var cards = shown.map(function (c) {
      var items = (c.items || []).filter(function (it) {
        return match(it.t + " " + it.bn + " " + it.uc + " " + (it.note || ""));
      });
      if (!items.length) return "";
      return '<h3 style="margin:16px 0 8px;color:var(--accent2)">' + esc(c.icon || "") + " " + esc(c.cat) + "</h3>" +
        items.map(function (it) {
          return '<article class="dua-card"><div style="font-weight:700">' + esc(it.t) + "</div>" +
            '<div class="ar" dir="rtl" lang="ar">' + esc(it.ar) + "</div>" +
            (it.uc ? '<div class="small" style="color:var(--muted)">উচ্চারণ: ' + esc(it.uc) + "</div>" : "") +
            (it.bn ? '<div class="bn bn-text">' + esc(it.bn) + "</div>" : "") +
            (it.note ? '<div class="small bn-text" style="color:var(--muted)">' + esc(it.note) + "</div>" : "") +
            (it.src ? '<div class="src">' + esc(it.src) + "</div>" : "") + "</article>";
        }).join("");
    }).join("");
    return chips + (cards || '<div class="empty">No du\'as match.</div>');
  }

  function learnView() {
    var list = (DATA.learn.guides || []).filter(function (g) {
      return match(g.t + " " + g.sub + " " + (g.intro || ""));
    });
    if (!list.length) return '<div class="empty">No guides match.</div>';
    return list.map(function (g, i) {
      var steps = (g.steps || []).map(function (st, j) {
        return '<div class="step"><h5>' + (j + 1) + ". " + esc(st.h) + "</h5>" +
          (st.p ? '<div class="bn-text">' + esc(st.p) + "</div>" : "") +
          (st.ar ? '<div class="ar" dir="rtl" lang="ar">' + esc(st.ar) + "</div>" : "") +
          (st.uc ? '<div class="small" style="color:var(--muted)">উচ্চারণ: ' + esc(st.uc) + "</div>" : "") +
          (st.bn ? '<div class="small bn-text">' + esc(st.bn) + "</div>" : "") +
          (st.src ? '<div class="src">' + esc(st.src) + "</div>" : "") + "</div>";
      }).join("");
      return '<details class="learn-card"' + (i === 0 ? " open" : "") + "><summary>" +
        '<span style="font-size:1.4rem">' + esc(g.icon || "") + "</span>" + esc(g.t) +
        '<span class="small" style="color:var(--muted);font-weight:400">' + esc(g.sub || "") + "</span></summary>" +
        '<div class="body">' + (g.intro ? '<p class="bn-text" style="line-height:1.8;margin-top:0">' + esc(g.intro) + "</p>" : "") +
        steps + (g.foot ? '<p class="small bn-text" style="color:var(--muted)">' + esc(g.foot) + "</p>" : "") +
        "</div></details>";
    }).join("");
  }

  function dailyView() {
    var day = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 864e5);
    var ay = (DATA.daily.ayahs || [])[day % Math.max(1, (DATA.daily.ayahs || []).length)] || {};
    var hd = (DATA.daily.hadith || [])[day % Math.max(1, (DATA.daily.hadith || []).length)] || {};
    var ayHtml = '<article class="dua-card"><div style="font-weight:700;color:var(--accent2)">Today\'s Ayah · আজকের আয়াত</div>' +
      '<div class="ar" dir="rtl" lang="ar">' + esc(ay.ar || "") + "</div>" +
      '<div class="bn bn-text">' + esc(ay.bn || "") + "</div>" +
      (ay.s ? '<div class="src"><a href="chapters/' + ay.s + '.html">Qur\'an ' + ay.s + ":" + ay.a + " →</a></div>" : "") + "</article>";
    var hdHtml = '<article class="dua-card"><div style="font-weight:700;color:var(--accent2)">Today\'s Hadith · আজকের হাদীস</div>' +
      '<div class="bn bn-text" style="font-size:1.02rem">' + esc(hd.t || "") + "</div>" +
      (hd.src ? '<div class="src">' + esc(hd.src) + "</div>" : "") + "</article>";
    var more = '<details style="margin-top:14px"><summary style="cursor:pointer;color:var(--accent2);font-weight:700">Browse all ' +
      (DATA.daily.ayahs || []).length + " daily ayahs &amp; " + (DATA.daily.hadith || []).length + " hadith</summary>" +
      (DATA.daily.ayahs || []).map(function (x) {
        return '<div class="topic-list"><div class="ayah"><div class="ar" dir="rtl" lang="ar">' + esc(x.ar) + "</div><div class=\"bn bn-text\">" + esc(x.bn) + '</div><div class="small"><a href="chapters/' + x.s + '.html">' + x.s + ":" + x.a + "</a></div></div></div>";
      }).join("") +
      (DATA.daily.hadith || []).map(function (x) {
        return '<div class="topic-list"><div class="ayah"><div class="bn-text">' + esc(x.t) + '</div><div class="small" style="color:var(--muted)">' + esc(x.src) + "</div></div></div>";
      }).join("") + "</details>";
    return ayHtml + hdHtml + more;
  }

  function topicsView() {
    var list = (DATA.topics.topics || []);
    if (topicIdx >= 0 && list[topicIdx]) {
      var t = list[topicIdx];
      return '<button class="btn ghost" id="topicBack" style="margin-bottom:12px">← All topics</button>' +
        '<h2 style="color:var(--accent2)">' + esc(t.icon || "") + " " + esc(t.t) + "</h2>" +
        '<div class="topic-list">' + (t.items || []).map(function (x) {
          return '<div class="ayah"><div class="ar" dir="rtl" lang="ar">' + esc(x.ar) + "</div>" +
            '<div class="bn bn-text">' + esc(x.bn) + "</div>" +
            '<div class="small"><a href="chapters/' + x.s + '.html">Qur\'an ' + x.s + ":" + x.a + " →</a></div></div>";
        }).join("") + "</div>";
    }
    var filtered = list.filter(function (t) { return match(t.t); });
    return '<div class="topic-grid">' + filtered.map(function (t, i) {
      return '<article class="topic-card" data-topic="' + list.indexOf(t) + '"><div class="n">' + esc(t.icon || "📖") + "</div>" +
        '<div class="t">' + esc(t.t) + '</div><div class="c">' + (t.items || []).length + " ayahs</div></article>";
    }).join("") + "</div>";
  }

  function render() {
    if (!root) return;
    if (!DATA[tab]) { root.innerHTML = '<div class="empty">Loading…</div>'; return; }
    root.innerHTML = tab === "names" ? namesView()
      : tab === "duas" ? duasView()
      : tab === "learn" ? learnView()
      : tab === "daily" ? dailyView()
      : topicsView();
    root.querySelectorAll("[data-cat]").forEach(function (b) {
      b.addEventListener("click", function () { duaCat = b.dataset.cat; render(); });
    });
    root.querySelectorAll("[data-topic]").forEach(function (b) {
      b.addEventListener("click", function () { topicIdx = parseInt(b.dataset.topic, 10); render(); });
    });
    var back = root.querySelector("#topicBack");
    if (back) back.addEventListener("click", function () { topicIdx = -1; render(); });
  }

  function setTab(t) {
    tab = t; q = (search && search.value || "").trim().toLowerCase(); topicIdx = -1;
    (tabs ? tabs.querySelectorAll("button") : []).forEach(function (b) {
      b.classList.toggle("active", b.dataset.tab === t);
    });
    render();
  }

  if (tabs) tabs.addEventListener("click", function (e) {
    var b = e.target.closest("button[data-tab]");
    if (b) setTab(b.dataset.tab);
  });
  if (search) search.addEventListener("input", function () {
    q = search.value.trim().toLowerCase(); render();
  });

  Promise.all([load("names"), load("duas"), load("learn"), load("daily"), load("topics")])
    .then(function (arr) {
      DATA.names = arr[0]; DATA.duas = arr[1]; DATA.learn = arr[2];
      DATA.daily = arr[3]; DATA.topics = arr[4];
      render();
    })
    .catch(function () {
      root.innerHTML = '<div class="empty">The knowledge hub could not load — check your connection and reload.</div>';
    });
})();
