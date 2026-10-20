/* Business & Trade explorer — trilingual knowledge cards (Qur'an, Hadith,
 * Companions, halal growth). Data: assets/data/business.json */
(function () {
  let DATA = null;
  let active = "all";

  function esc(s) {
    return String(s == null ? "" : s).replace(/[<>&"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" }[c]));
  }
  const L = (o, k) => (o && typeof o === "object" ? o[k] : o) || "";

  function refLink(ref) {
    if (!ref) return "";
    const m = String(ref).match(/(\d{1,3})/);
    if (!m) return `<span class="biz-ref">${esc(ref)}</span>`;
    return `<a class="biz-ref" href="chapters/${m[1]}.html">Qur'an ${esc(ref)}</a>`;
  }

  function card(it) {
    const foot = `${it.source ? `<span class="biz-src">${esc(it.source)}</span>` : ""}${refLink(it.ref)}`;
    return `<article class="biz-card glass">
      ${it.ar ? `<div class="biz-ar">${esc(it.ar)}</div>` : ""}
      ${it.en ? `<div class="biz-en">${esc(it.en)}</div>` : ""}
      ${it.bn ? `<div class="biz-bn bn-text">${esc(it.bn)}</div>` : ""}
      <div class="biz-foot">${foot}</div>
    </article>`;
  }

  function renderTabs(host) {
    const secs = DATA.sections || [];
    host.innerHTML = [`<button data-sec="all" class="active">All</button>`]
      .concat(secs.map((s) => `<button data-sec="${esc(s.id)}">${esc(L(s.title, "en"))}</button>`))
      .join("");
    host.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => {
      active = b.dataset.sec;
      host.querySelectorAll("button").forEach((x) => x.classList.toggle("active", x === b));
      render();
    }));
  }

  function render() {
    const wrap = document.getElementById("bizBody");
    if (!wrap) return;
    const secs = (DATA.sections || []).filter((s) => active === "all" || s.id === active);
    wrap.innerHTML = secs.map((s) => `
      <section class="biz-section">
        <h2 class="biz-sec-title">${esc(L(s.title, "en"))}<span class="bn-text">${esc(L(s.title, "bn"))}</span></h2>
        <div class="biz-grid">${(s.items || []).map(card).join("")}</div>
      </section>`).join("");
    document.getElementById("bizCount").textContent =
      secs.reduce((n, s) => n + (s.items || []).length, 0) + " entries";
  }

  document.addEventListener("DOMContentLoaded", () => {
    fetch("assets/data/business.json")
      .then((r) => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then((d) => {
        DATA = d;
        document.getElementById("bizLoading").hidden = true;
        const intro = document.getElementById("bizIntro");
        if (intro) {
          intro.querySelector(".bi-en").textContent = L(d.intro, "en");
          intro.querySelector(".bi-bn").textContent = L(d.intro, "bn");
          intro.querySelector(".bi-ar").textContent = L(d.intro, "ar");
        }
        renderTabs(document.getElementById("bizTabs"));
        render();
      })
      .catch(() => {
        const el = document.getElementById("bizLoading");
        if (el) el.textContent = "Business knowledge could not load — check your connection and reload.";
      });
  });
})();
