/* Global tafsir search — lazily loads the prebuilt index (from tafsir.db SQLite, FTS-style ranking) */
(function(){
  const APP = document.querySelector(".page-wrap");
  let IDX = null;          // [surah, ayah, en, bn]
  let ALT = {};            // ayah_key -> {source: text}
  let NAMES = {};          // surah n -> {ar, en, bn}
  let lastResults = [];

  function esc(s){ return String(s==null?"":s).replace(/[<>&"]/g, c=>({"<":"&lt;",">":"&gt;","&":"&amp;",'"':"&quot;"}[c])); }

  function initNames(){
    const chapters = (window.CHAPTERS && (window.CHAPTERS.chapters || window.CHAPTERS)) || [];
    (Array.isArray(chapters) ? chapters : Object.values(chapters)).forEach(c=>{ if(c && c.n) NAMES[c.n]=c; });
    const sel = document.getElementById("qSurah");
    let o = '<option value="0">All surahs</option>';
    for(let n=1;n<=114;n++){
      const c = NAMES[n]||{ar:"سورة", en:"Surah "+n};
      o += `<option value="${n}">${n}. ${esc(c.en||"")}</option>`;
    }
    sel.innerHTML = o;
  }

  function mark(text, words){
    let out = esc(text);
    words.forEach(w=>{
      const rx = new RegExp("("+w.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+")", "gi");
      out = out.replace(rx, "<mark>$1</mark>");
    });
    return out;
  }

  function altFor(surah, ayah){
    const k = surah + ":" + ayah;
    if(!ALT[k]) return "";
    const parts = Object.entries(ALT[k]).slice(0,2)
      .map(([src,txt])=>`<b>${esc(src)}:</b> ${esc(txt)}`);
    return parts.length ? `<div class="sr-alt">${parts.join(" · ")}</div>` : "";
  }

  function rank(terms, en, bn){
    let s = 0;
    for(const t of terms){
      const enI = en.indexOf(t), bnI = bn.indexOf(t);
      if(enI < 0 && bnI < 0) return -1;
      s += 10;
      if(enI === 0 || bnI === 0) s += 6;
    }
    s += Math.max(0, 40 - en.length/12);
    return s;
  }

  function run(){
    const raw = (document.getElementById("qInput").value || "").trim();
    const terms = raw.toLowerCase().split(/\s+/).filter(Boolean);
    const sn = parseInt(document.getElementById("qSurah").value,10)||0;
    const lang = document.getElementById("qLang").value;
    const res = document.getElementById("qResults");
    const emp = document.getElementById("qEmpty");
    lastResults = [];
    document.getElementById("qHints").innerHTML = "";

    if(!IDX){ document.getElementById("qMeta").textContent = "Search index still loading…"; return; }
    if(!terms.length || (lang!=="both" && !raw)){ res.innerHTML=""; emp.hidden=true; document.getElementById("qMeta").textContent = `${IDX.length.toLocaleString()} passages indexed`; return; }

    const rows = [];
    for(const r of IDX){
      const [s,a,en,bn] = r;
      if(sn && s!==sn) continue;
      const e = en.toLowerCase(), b = bn.toLowerCase();
      if(lang==="both"){
        let any=false; for(const t of terms){ if(e.includes(t)||b.includes(t)){ any=true; break; } } if(!any) continue;
      } else {
        const hay = lang==="en" ? e : b;
        let all=true; for(const t of terms){ if(!hay.includes(t)){ all=false; break; } } if(!all) continue;
      }
      rows.push({r, score: rank(terms, e, b)});
    }
    rows.sort((x,y)=>y.score-x.score);
    lastResults = rows.slice(0, 60);

    res.innerHTML = lastResults.map(({r})=>{
      const [s,a,en,bn] = r;
      const name = NAMES[s]||{en:"Surah "+s, ar:""};
      return `<a class="sr-item glass" href="chapters/${s}.html">
        <span class="sr-ref">${s}. ${esc(name.en||"")} · ${esc(name.ar||"")} — [${a}]</span>
        <div class="sr-en">${mark(en, terms)}</div>
        <div class="sr-bn bn-text">${mark(bn, terms)}</div>
        ${altFor(s, a)}
      </a>`;
    }).join("");
    emp.hidden = lastResults.length !== 0;
    document.getElementById("qMeta").textContent = raw ? `${lastResults.length} best matches${rows.length>60? " of "+rows.length.toLocaleString():""}` : "";
  }

  function hints(){
    const h = document.getElementById("qHints");
    h.innerHTML = [
      ["creation of the heavens", "the Big Bang verse lens"],
      ["রহমত", "mercy in Bengali"],
      ["Iron", "Surah 57 · science"],
      ["seven", "heavens layers"],
      ["day of", "judgment scenes"]
    ].map(([q, what]) => `<button class="btn ghost" style="justify-self:start" data-hint="${esc(q)}">${esc(q)}<span style="color:var(--muted);font-weight:400"> — ${esc(what)}</span></button>`).join("");
    h.querySelectorAll("[data-hint]").forEach(b=>b.addEventListener("click",()=>{
      document.getElementById("qInput").value = b.dataset.hint; run();
    }));
  }

  function boot(data){ IDX = data; initNames(); hints(); document.getElementById("qLoading").hidden = true; document.getElementById("qMeta").textContent = `${data.length.toLocaleString()} passages indexed`; const u = new URLSearchParams(location.search).get("q"); if(u){ document.getElementById("qInput").value = u; run(); } }

  document.addEventListener("DOMContentLoaded", ()=>{
    fetch("assets/data/search_index.json").then(r=>{ if(!r.ok) throw new Error("HTTP "+r.status); return r.json(); })
      .then(boot)
      .catch(()=>{ document.getElementById("qLoading").textContent = "Search index could not load — reload once you are online."; });
    document.getElementById("qBtn").addEventListener("click", run);
    document.getElementById("qInput").addEventListener("keydown", e=>{ if(e.key==="Enter") run(); });
    document.getElementById("qInput").addEventListener("input", ()=>{ const v=document.getElementById("qInput").value; if(v.length>=2&&v.length%2===0) run(); });
    document.getElementById("qSurah").addEventListener("change", run);
    document.getElementById("qLang").addEventListener("change", run);
    fetch("assets/data/alt_meanings.json").then(r=>r.ok?r.json():null).then(d=>{ ALT = d||{}; }).catch(()=>{});
  });
})();
