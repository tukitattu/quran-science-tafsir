/* Wikipedia integration — fetches summaries + full 15 sections via REST API for whole project */
(function(){
  const CACHE_TTL = 24*60*60*1000; // 24h
  const API_SUMMARY = 'https://en.wikipedia.org/api/rest_v1/page/summary/';
  const API_HTML = 'https://en.wikipedia.org/api/rest_v1/page/html/';

  async function fetchWiki(title, lang='en'){
    const key = `wiki:${lang}:${title}`;
    try{
      const cached = JSON.parse(localStorage.getItem(key)||'null');
      if(cached && Date.now() - cached.ts < CACHE_TTL) return cached.data;
    }catch{}
    try{
      const r = await fetch(API_SUMMARY + encodeURIComponent(title), {
        headers: {'Api-User-Agent': 'ScientificTafsir/1.0 (https://etside.github.io/quran-science-tafsir/)'}
      });
      if(!r.ok) throw new Error(r.status);
      const data = await r.json();
      const payload = {
        title: data.title,
        extract: data.extract,
        thumbnail: data.thumbnail?.source || null,
        url: data.content_urls?.desktop?.page || `https://${lang}.wikipedia.org/wiki/${title}`
      };
      localStorage.setItem(key, JSON.stringify({ts: Date.now(), data: payload}));
      return payload;
    }catch(e){
      console.warn('Wiki fetch failed', title, e);
      return null;
    }
  }

  // Fetch full HTML and parse 15 sections
  async function fetchWikiSections(title, lang='en'){
    const key = `wiki:sections:${lang}:${title}`;
    try{
      const cached = JSON.parse(localStorage.getItem(key)||'null');
      if(cached && Date.now() - cached.ts < CACHE_TTL) return cached.data;
    }catch{}
    try{
      const r = await fetch(API_HTML + encodeURIComponent(title), {
        headers: {'Api-User-Agent': 'ScientificTafsir/1.0 (https://etside.github.io/quran-science-tafsir/)'}
      });
      if(!r.ok) throw new Error(r.status);
      const html = await r.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const sections = {};
      // Extract lead (before first h2)
      const lead = doc.querySelector('section[data-mw-section-id="0"]');
      if(lead) sections['Lead'] = lead.innerHTML.slice(0, 800);
      // Extract all h2 sections
      doc.querySelectorAll('h2').forEach(h2=>{
        const title = h2.textContent.trim().replace(/\[edit\]/,'').trim();
        // Find next sibling until next h2
        let content = '';
        let next = h2.parentElement.nextElementSibling;
        // Wikipedia REST HTML wraps sections in <section> with data-mw-section-id
        const section = h2.closest('section');
        if(section){
          // Get all content until next section
          const secId = section.getAttribute('data-mw-section-id');
          // Collect paragraphs from this section
          const paras = section.querySelectorAll('p');
          paras.forEach(p=>{ if(p.textContent.trim().length>20) content += p.outerHTML; });
          if(content.length>50) sections[title] = content.slice(0, 1200);
        }
      });
      const payload = { title, sections, url: `https://${lang}.wikipedia.org/wiki/${title}` };
      localStorage.setItem(key, JSON.stringify({ts: Date.now(), data: payload}));
      return payload;
    }catch(e){
      console.warn('Wiki sections fetch failed', title, e);
      return null;
    }
  }

  async function renderWikiSurah(n, containerId){
    const title = (window.WIKI_MAP?.surah||{})[n];
    if(!title) return;
    const el = document.getElementById(containerId);
    if(!el) return;
    el.innerHTML = '<div class="skeleton skeleton-text" style="width:90%"></div><div class="skeleton skeleton-text" style="width:75%"></div><div class="skeleton skeleton-text" style="width:85%"></div>';
    const data = await fetchWiki(title);
    const sectionsData = await fetchWikiSections(title);
    if(!data && !sectionsData){ el.innerHTML = `<p class="small">Wikipedia: <a href="https://en.wikipedia.org/wiki/${title}" target="_blank" rel="noopener">View ${title} on Wikipedia →</a></p>`; return; }
    let html = '';
    if(data){
      html += `
      <div style="display:flex; gap:12px; align-items:start; margin-bottom:12px">
        ${data.thumbnail ? `<img src="${data.thumbnail}" alt="" style="width:80px;height:80px;object-fit:cover;border-radius:8px;flex-shrink:0">` : ''}
        <div>
          <b>${data.title}</b>
          <p style="margin:6px 0; color:var(--muted); font-size:0.92rem; line-height:1.6">${data.extract}</p>
          <a href="${data.url}" target="_blank" rel="noopener" style="color:var(--accent2); font-size:0.85rem">Read more on Wikipedia →</a>
        </div>
      </div>`;
    }
    // Add 15 Wikipedia sections as collapsible sub-tabs (History, Modern scholarship, etc.)
    if(sectionsData && sectionsData.sections){
      const order = ['History','Modern scholarship','Contents','Text and arrangement','Significance in Islam','Interpretation','Translations','Recitation','Writing and printing','Criticism','Relationship with other literature','See also','Notes','References','Further reading','External links'];
      const available = order.filter(k=> sectionsData.sections[k]);
      if(available.length){
        html += '<div style="margin-top:12px; border-top:1px solid var(--border); padding-top:12px"><b style="color:var(--accent2); font-size:0.85rem">Wikipedia — All Sections (15):</b>';
        available.forEach(secTitle=>{
          const content = sectionsData.sections[secTitle];
          html += `<details style="margin:8px 0; background:var(--bg2); border:1px solid var(--border); border-radius:8px; padding:8px 10px"><summary style="cursor:pointer; font-weight:600; font-size:0.85rem; color:var(--text)">${secTitle}</summary><div style="margin-top:8px; font-size:0.85rem; line-height:1.6; color:var(--muted); max-height:200px; overflow-y:auto">${content}</div><a href="${sectionsData.url}#${encodeURIComponent(secTitle.replace(/\s+/g,'_'))}" target="_blank" rel="noopener" style="font-size:0.75rem; color:var(--accent2)">View on Wikipedia →</a></details>`;
        });
        html += '</div>';
      }
    }
    // Inject relevant sections into other tabs across the whole project
    setTimeout(()=>{
      const map = {
        'context': ['History','Text and arrangement'],
        'roots': ['Writing and printing'],
        'science': ['Modern scholarship','Criticism'],
        'alt': ['Translations','Interpretation'],
        'deep-amud': ['Contents','Significance in Islam'],
        'deep-wbw': ['Text and arrangement','Writing and printing'],
        'deep-meanings': ['Interpretation','Translations'],
        'deep-balagha': ['Modern scholarship','Relationship with other literature'],
        'deep-gaur': ['Significance in Islam','Criticism']
      };
      Object.entries(map).forEach(([kb, wikiSections])=>{
        if(!sectionsData || !sectionsData.sections) return;
        const tabEl = document.querySelector(`[data-kb="${kb}"]`);
        if(!tabEl || tabEl.dataset.wikiAdded) return;
        if(tabEl.innerHTML.includes('skeleton')) return; // still loading, wait
        let added = false;
        wikiSections.forEach(wsTitle=>{
          const content = sectionsData.sections[wsTitle];
          if(!content) return;
          const wikiRef = document.createElement('div');
          wikiRef.style.cssText='margin-top:12px; padding:10px; background:rgba(212,175,55,0.06); border-left:3px solid var(--accent); border-radius:6px; font-size:0.82rem;';
          wikiRef.innerHTML=`<b style="color:var(--accent2)">Wikipedia: ${wsTitle}</b><div style="color:var(--muted); margin-top:4px; max-height:120px; overflow-y:auto">${content.slice(0,400)}...</div><a href="${sectionsData.url}#${encodeURIComponent(wsTitle.replace(/\s+/g,'_'))}" target="_blank" rel="noopener" style="font-size:0.75rem; color:var(--accent2)">Read full on Wikipedia →</a>`;
          tabEl.appendChild(wikiRef);
          added = true;
        });
        if(added) tabEl.dataset.wikiAdded='1';
      });
    }, 1000);
    el.innerHTML = html;
  }

  async function enhanceScienceCards(){
    document.querySelectorAll('.sci-card').forEach(async card=>{
      const topic = card.querySelector('b')?.textContent?.trim();
      if(!topic) return;
      // Find wiki title for topic
      let wikiTitle = null;
      const sciMap = window.WIKI_MAP?.science || {};
      for(const [k,v] of Object.entries(sciMap)){
        if(topic.toLowerCase().includes(k.toLowerCase())){ wikiTitle=v; break; }
      }
      if(!wikiTitle){
        // Try direct: use topic as title
        wikiTitle = topic.replace(/\s+/g,'_');
      }
      // Avoid duplicate
      if(card.dataset.wikiDone) return;
      card.dataset.wikiDone="1";
      const link = document.createElement('a');
      link.href=`https://en.wikipedia.org/wiki/${wikiTitle}`;
      link.target="_blank"; link.rel="noopener";
      link.style.cssText="display:inline-block; margin-top:6px; font-size:0.78rem; color:var(--accent2);";
      link.textContent="Wikipedia →";
      // Try to fetch summary and show inline on click
      link.addEventListener('click', async (e)=>{
        if(link.dataset.loaded) return;
        e.preventDefault();
        link.textContent="Loading…";
        const data = await fetchWiki(decodeURIComponent(wikiTitle));
        if(data){
          const box=document.createElement('div');
          box.style.cssText="margin-top:8px; padding:8px; background:var(--bg2); border-radius:8px; font-size:0.85rem; line-height:1.6; color:var(--muted);";
          box.innerHTML=`<b>${data.title}</b>: ${data.extract} <a href="${data.url}" target="_blank" rel="noopener" style="color:var(--accent2)">More →</a>`;
          card.appendChild(box);
          link.dataset.loaded="1";
          link.textContent="Wikipedia ✓";
        } else {
          window.open(link.href, '_blank');
        }
      });
      card.appendChild(link);
    });
  }

  // Auto-fetch all WIKI_MAP contexts for current surah (no manual search) — uses WIKI_MAP to extract key topics, science terms, history, places, concepts
  async function autoFetchWikiForSurah(n){
    const surahTitle = (window.WIKI_MAP?.surah||{})[n];
    if(!surahTitle) return;
    const deep = (window.DEEP_RESEARCH||{})[n] || (window.DEEP_RESEARCH||{})[String(n)] || {};
    const know = (window.SURAH_KNOWLEDGE||{})[n] || (window.SURAH_KNOWLEDGE||{})[String(n)] || {};
    const topics = new Set();
    (know.science||[]).forEach(s=>{ if(s.topic) topics.add(s.topic); });
    (deep.science||[]).forEach(s=>{ if(s.topic) topics.add(s.topic); });
    Object.values(window.WIKI_MAP?.history||{}).forEach(v=> topics.add(v.replace(/_/g,' ')));
    Object.values(window.WIKI_MAP?.concepts||{}).forEach(v=> topics.add(v));
    const toFetch = [surahTitle, ...Array.from(topics).slice(0,3)];
    const container = document.getElementById(`wiki-surah-${n}`);
    if(!container) return;
    container.innerHTML = '<div class="skeleton skeleton-card"></div><div class="skeleton skeleton-card"></div>';
    const results = await Promise.allSettled(toFetch.map(t=> fetchWiki(t)));
    let html = '';
    results.forEach((r)=>{
      if(r.status==='fulfilled' && r.value){
        const d=r.value;
        html += `<div class="wiki-card" style="display:flex; gap:12px; align-items:start; margin:8px 0; padding:10px; background:var(--bg2); border:1px solid var(--border); border-radius:8px">
          ${d.thumbnail ? `<img src="${d.thumbnail}" alt="" style="width:60px;height:60px;object-fit:cover;border-radius:6px;flex-shrink:0">` : ''}
          <div><b style="color:var(--accent2)">${d.title}</b><p style="margin:4px 0; color:var(--muted); font-size:0.85rem; line-height:1.5">${d.extract.slice(0,220)}...</p><a href="${d.url}" target="_blank" rel="noopener" style="font-size:0.78rem; color:var(--accent2)">Read on Wikipedia →</a></div>
        </div>`;
      }
    });
    if(html) container.innerHTML = html;
    else container.innerHTML = `<p class="small">Wikipedia: <a href="https://en.wikipedia.org/wiki/${surahTitle}" target="_blank" rel="noopener">View ${surahTitle} on Wikipedia →</a></p>`;
  }

  // Render related videos from the two curated channels — independent of Wikipedia.
  function renderVideos(n){
    const containers = [
      document.querySelector('[data-kb="ghaur-science"]'),
      document.querySelector('[data-kb="ghaur-fikr-science"]')
    ].filter(Boolean);
    if(!containers.length) return;
    const ghaurData = (window.GHAUR_O_FIKR_MAP||{})[n] || (window.GHAUR_O_FIKR_MAP||{})[String(n)] || [];
    containers.forEach(el=>{
      if(el.dataset.done) return;
      if(ghaurData.length===0){
        if(window.VT && VT.renderChannelLinks) VT.renderChannelLinks(el);
        else el.innerHTML='<p class="small" style="color:var(--muted)">No videos mapped for this surah yet — <a href="https://www.youtube.com/@NAKBangla/videos" target="_blank" rel="noopener" style="color:var(--accent2)">NAK Bangla</a> · <a href="https://www.youtube.com/@qurandailydose2985/videos" target="_blank" rel="noopener" style="color:var(--accent2)">Dr Sufyan — Quran Daily Dose</a></p>';
      } else {
        el.innerHTML = '<div class="yt-grid"></div>';
        const grid = el.querySelector('.yt-grid');
        if(window.VT && VT.render) VT.render(grid, ghaurData);
        else el.innerHTML = ghaurData.map(item=>`<div style="margin:8px 0"><a href="https://www.youtube.com/watch?v=${item.youtubeId}" target="_blank" rel="noopener" style="color:var(--accent2)">${item.title}</a></div>`).join('');
      }
      el.dataset.done='1';
    });
  }

  // Auto-enhance on load — auto-fetch via WIKI_MAP (no manual search needed)
  function initWiki(){
    const m = location.pathname.match(/chapters\/(\d+)\.html/);
    if(m){
      const n=parseInt(m[1]);
      autoFetchWikiForSurah(n);
      renderVideos(n);
      setTimeout(enhanceScienceCards, 800);
      document.addEventListener('click', e=>{
        if(e.target.closest('summary')) setTimeout(enhanceScienceCards, 300);
      });
    }
    // Global Wikipedia search in header (if exists) — still supports manual search as fallback, but primary is auto-fetch
    const search = document.getElementById('wikiSearch');
    if(search){
      search.addEventListener('keydown', async e=>{
        if(e.key==='Enter'){
          const q=e.target.value.trim();
          if(!q) return;
          const data=await fetchWiki(q);
          const out=document.getElementById('wikiSearchOut');
          if(out && data){
            out.innerHTML=`<b>${data.title}</b>: ${data.extract} <a href="${data.url}" target="_blank">More →</a>`;
            out.style.display='block';
          }
        }
      });
    }
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', initWiki);
  else initWiki();

  // Unified data fetcher — consolidates local JSON, WIKI_MAP, and external (Ghaur o Fikr, Bayyinah, Corpus)
  async function fetchKnowledgeData(surahNumber){
    const n = parseInt(surahNumber);
    const result = { surah: n, wiki: null, deep: null, know: null, ghaur: [], bayyinah: [] };
    try{ result.wiki = await fetchWiki((window.WIKI_MAP?.surah||{})[n] || `Surah_${n}`); }catch{}
    try{ result.deep = (window.DEEP_RESEARCH||{})[n] || (window.DEEP_RESEARCH||{})[String(n)] || null; }catch{}
    try{ result.know = (window.SURAH_KNOWLEDGE||{})[n] || (window.SURAH_KNOWLEDGE||{})[String(n)] || null; }catch{}
    try{ result.ghaur = (window.GHAUR_O_FIKR_MAP||{})[n] || []; }catch{}
    // Bayyinah is inside deep.wordByWord[*].alternative_meanings and root_analysis
    if(result.deep && result.deep.wordByWord){
      result.bayyinah = result.deep.wordByWord.map(w=> ({w: w.w, root_analysis: w.root_analysis, alternative_meanings: w.alternative_meanings})).filter(x=>x.root_analysis);
    }
    return result;
  }

  window.Wiki = {fetchWiki, fetchWikiSections, renderWikiSurah: autoFetchWikiForSurah, enhanceScienceCards, autoFetchWikiForSurah, fetchKnowledgeData, renderVideos};
})();
