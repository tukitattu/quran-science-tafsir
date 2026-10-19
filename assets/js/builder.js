/* Interactive Meaning Builder — select word alternatives & science lens to form your tadabbur, within Quranic rules */
(function(){
  function Hesc(s){ const d=document.createElement('div'); d.textContent=s; return d.innerHTML; }

  function renderBuilder(n, attempt=0){
    const host = document.getElementById(`builder-${n}`);
    if(!host) return;
    // Show skeletons on first attempt
    if(attempt===0){
      host.innerHTML='<div class="skeleton skeleton-title" style="width:70%"></div><div class="skeleton skeleton-card"></div><div class="skeleton skeleton-card"></div><div class="skeleton skeleton-text" style="width:90%"></div>';
    }
    const deep = (window.DEEP_RESEARCH||{})[n] || (window.DEEP_RESEARCH||{})[String(n)];
    if(!deep || !deep.wordByWord){
      if(attempt < 8){ setTimeout(()=>renderBuilder(n, attempt+1), 400); return; }
      host.innerHTML='<div style="text-align:center;padding:20px"><p class="small" style="color:var(--muted)">Word data is being prepared for this surah — check back after the next research update.</p><button class="btn ghost" style="margin-top:8px" onclick="location.reload()">↻ Reload</button> <button class="btn ghost" style="margin-top:8px" onclick="renderBuilder('+n+',0)">↻ Retry Fetch</button></div>'; return;
    }

    // Build alternatives per word: 3 options from different lenses
    // Skip placeholder rows (auto-generated filler words like كلمة111) — never show invented data
    const real = deep.wordByWord.filter(w => w.w && !/^كلمة\d+/.test(w.w) && (w.en || w.why));
    const words = real.map((w, idx) => {
      // Create 3 alternatives: Traditional, Literal Root, Scientific/Contextual
      const alts = [
        { label: w.en, bn: w.bn, src: 'Scientific Tafsir', en: w.en },
        { label: `Root: ${w.root} — literal`, en: `(${w.root}) ${w.en.split('—')[0].trim()}`, bn: `(${w.root}) ${w.bn}`, src: 'Sarf' },
        { label: w.why.slice(0,60), en: w.why, bn: w.why, src: 'Why this word?' }
      ];
      // For known words, provide more authentic alternatives
      if(w.w.includes('رَبّ')) {
        alts[0]={label:'Sustainer-Evolver', en:'Sustainer who evolves you step-by-step', bn:'যিনি ধাপে ধাপে লালন-পালন ও বিবর্তন করেন', src:'Literal ر-ب-ب'};
        alts[1]={label:'Lord (Pickthall)', en:'Lord', bn:'প্রভু', src:'Pickthall'};
        alts[2]={label:'Master/Nurturer', en:'Master & Nurturer', bn:'প্রতিপালক', src:'Yusuf Ali'};
      }
      if(w.w.includes('رَّحْمَٰن')) {
        alts[0]={label:'Entirely Merciful (vast, now)', en:'Entirely Merciful — overflowing mercy now', bn:'পরম করুণাময় — এখনই প্রবাহিত দয়া', src:'fa\'lan'};
        alts[1]={label:'Most Merciful', en:'Most Merciful', bn:'অতি দয়ালু', src:'Traditional'};
        alts[2]={label:'Compassionate', en:'Compassionate to all creation', bn:'সমগ্র সৃষ্টির প্রতি দয়ালু', src:'Contextual'};
      }
      if(w.w.includes('إِيَّاكَ')) {
        alts[0]={label:'ONLY You (exclusive)', en:'ONLY You', bn:'কেবল তোমাকেই', src:'Balagha حصْر'};
        alts[1]={label:'You (emphatic)', en:'You alone', bn:'তোমাকেই', src:'Zamakhshari'};
        alts[2]={label:'You — no partner', en:'You — with no partner', bn:'তোমাকেই — কোন শরীক ছাড়া', src:'Tawhid'};
      }
      return { ...w, alts, idx };
    });

    // Science alternatives - from SURAH_KNOWLEDGE science + deep science
    const sciData = ((window.SURAH_KNOWLEDGE||{})[n]||{}).science || [];
    const deepSci = deep.science || [];
    const sciAlts = [...sciData, ...deepSci].slice(0,3).map((s,i)=>({
      id: i,
      topic: s.topic,
      en: s.en || s.topic,
      bn: s.bn || s.en || s.topic,
      ref: s.ref || '—',
      sci: s.sci || ''
    }));
    if(sciAlts.length===0) sciAlts.push({id:0, topic:'No specific science ref for this surah', en:'Read as spiritual guidance; science is a lens, not the core.', bn:'আধ্যাত্মিক হেদায়েত হিসেবে পড়ুন; বিজ্ঞান একটি দৃষ্টিকোণ, মূল নয়।', ref:'—', sci:'Tafsir principle'});

    let html = `
      <div class="quran-rule">
        <b><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d4af37" stroke-width="1.8" style="vertical-align:-3px;margin-right:6px"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg> Quranic Principles — Please Read</b>
        <ul>
          <li><b>Arabic is fixed (محفوظ):</b> You are choosing <em>translation/interpretation</em> of a word, not changing the Quran. The Arabic <code>${words[0]?.w||'آية'}</code> stays as revealed.</li>
          <li><b>Sources matter:</b> Each alternative shows its source (Pickthall / Root / Scientific Tafsir / Balagha). Prefer classical tafsir for creed, use science as tadabbur, not as proof.</li>
          <li><b>No new Quran:</b> Your built meaning is <b>your personal tadabbur</b> for understanding — not a new translation to recite in salat or teach as Quran.</li>
          <li><b>Consult & verify:</b> For law/creed, refer to scholars (Tabari, Ibn Kathir, Qurtubi). This tool is for reflection (Gaur Fikr).</li>
        </ul>
      </div>
      <div class="word-builder" id="wb-${n}">
    `;
    words.forEach(w=>{
      html += `<div class="word-card" data-idx="${w.idx}">
        <div class="w-head"><span class="w-ar">${Hesc(w.w)} <span class="w-meta">${Hesc(w.tr)} · ${Hesc(w.root)} · ${Hesc(w.form)}</span></span><span class="w-meta">${w.idx+1}/${words.length}</span></div>
        <div class="w-meta">${Hesc(w.why)}</div>
        <div class="word-alts">` + w.alts.map((a,i)=>`<button data-w="${w.idx}" data-a="${i}" class="${i===0?'active':''}" onclick="BuilderPick(${n},${w.idx},${i})">${Hesc(a.label)}<span class="src">${Hesc(a.src)}</span></button>`).join('') + `</div>
      </div>`;
    });
    html += `</div>
      <div class="preview-box" id="preview-${n}">
        <h5>Your Understanding — Preview (updates live)</h5>
        <div class="preview-en" id="preview-en-${n}"></div>
        <div class="preview-bn" id="preview-bn-${n}"></div>
      </div>
      <div class="preview-actions">
        <button class="btn" onclick="BuilderSave(${n})">💾 Save My Version</button>
        <button class="btn ghost" onclick="BuilderReset(${n})">↺ Reset</button>
        <button class="btn ghost" onclick="BuilderShare(${n})">🔗 Copy Link</button>
        <span id="builder-msg-${n}" style="font-size:0.78rem;color:var(--muted);align-self:center"></span>
      </div>
      <div class="science-builder" id="sci-${n}">
        <h5 style="color:var(--accent2);font-size:0.85rem;letter-spacing:1px;text-transform:uppercase;margin:6px 0 8px">🔬 Choose Science Lens (optional)</h5>
        ` + sciAlts.map(s=>`<label class="sci-opt ${s.id===0?'active':''}" data-sci="${s.id}"><input type="radio" name="sci-${n}" value="${s.id}" ${s.id===0?'checked':''} onchange="BuilderPickSci(${n},${s.id})"> <b>${Hesc(s.topic)}</b> <span class="small">(${Hesc(s.ref)} · ${Hesc(s.sci)})</span><div class="small">${Hesc(s.en)}</div><div class="small bn-text">${Hesc(s.bn)}</div></label>`).join('') + `
      </div>
      <p class="small" style="color:var(--muted);padding:0 16px 12px">Your selections are saved locally (localStorage) per surah. Share the link to show your tadabbur — it encodes your choices in the URL hash.</p>
    `;

    host.innerHTML = html;
    // init preview
    BuilderUpdate(n);
    // restore saved
    const saved = JSON.parse(localStorage.getItem(`builder-${n}`)||'null');
    if(saved && saved.picks){
      Object.entries(saved.picks).forEach(([wi,ai])=> BuilderPick(n, parseInt(wi), parseInt(ai), true));
      if(saved.sci!=null) BuilderPickSci(n, saved.sci, true);
    }
    // hash restore
    const hash = new URLSearchParams(location.hash.slice(1));
    const h = hash.get(`b${n}`);
    if(h){
      try{ const arr=h.split(',').map(x=>parseInt(x)); arr.forEach((ai,wi)=>{ if(!isNaN(ai)) BuilderPick(n, wi, ai, true); }); }catch{}
    }
  }

  window.BuilderPick = function(n, wi, ai, silent){
    const card = document.querySelector(`#wb-${n} [data-idx="${wi}"]`);
    if(card) card.querySelectorAll('button').forEach(b=> b.classList.toggle('active', parseInt(b.dataset.a)===ai));
    if(!silent) BuilderUpdate(n);
  };
  window.BuilderPickSci = function(n, id, silent){
    document.querySelectorAll(`#sci-${n} .sci-opt`).forEach(el=> el.classList.toggle('active', parseInt(el.dataset.sci)===id));
    const r = document.querySelector(`#sci-${n} input[value="${id}"]`);
    if(r) r.checked = true;
    if(!silent) BuilderUpdate(n);
  };
  window.BuilderUpdate = function(n){
    const deep = (window.DEEP_RESEARCH||{})[n];
    if(!deep) return;
    const words = deep.wordByWord.filter(w => w.w && !/^كلمة\d+/.test(w.w) && (w.en || w.why));
    const picks = {};
    document.querySelectorAll(`#wb-${n} [data-idx]`).forEach(card=>{
      const wi = parseInt(card.dataset.idx);
      const act = card.querySelector('button.active');
      picks[wi] = act ? parseInt(act.dataset.a) : 0;
    });
    // Build preview by joining selected alts' en/bn
    const sciActive = document.querySelector(`#sci-${n} input:checked`);
    const sciId = sciActive ? parseInt(sciActive.value) : 0;
    let enParts = [], bnParts = [];
    words.forEach((w, idx)=>{
      const ai = picks[idx] ?? 0;
      // Reconstruct alts as in renderBuilder (must match)
      let alts = [
        {en: w.en, bn: w.bn},
        {en: `(${w.root}) ${w.en.split('—')[0].trim()}`, bn: `(${w.root}) ${w.bn}`},
        {en: w.why, bn: w.why}
      ];
      if(w.w.includes('رَبّ')) alts=[{en:'Sustainer who evolves step-by-step',bn:'যিনি ধাপে ধাপে লালন-পালন করেন'},{en:'Lord',bn:'প্রভু'},{en:'Master & Nurturer',bn:'প্রতিপালক'}];
      if(w.w.includes('رَّحْمَٰن')) alts=[{en:'Entirely Merciful — overflowing mercy now',bn:'পরম করুণাময় — এখনই প্রবাহিত দয়া'},{en:'Most Merciful',bn:'অতি দয়ালু'},{en:'Compassionate to all',bn:'সমগ্র সৃষ্টির প্রতি দয়ালু'}];
      if(w.w.includes('إِيَّاكَ')) alts=[{en:'ONLY You',bn:'কেবল তোমাকেই'},{en:'You alone',bn:'তোমাকেই'},{en:'You — no partner',bn:'তোমাকেই — কোন শরীক ছাড়া'}];
      enParts.push(alts[ai]?.en || alts[0].en);
      bnParts.push(alts[ai]?.bn || alts[0].bn);
    });
    const enPreview = enParts.join(' · ');
    const bnPreview = bnParts.join(' · ');
    const enEl = document.getElementById(`preview-en-${n}`);
    const bnEl = document.getElementById(`preview-bn-${n}`);
    if(enEl) enEl.textContent = enPreview;
    if(bnEl) bnEl.textContent = bnPreview;
    // also append science lens
    const sciData = ((window.SURAH_KNOWLEDGE||{})[n]||{}).science || [];
    const deepSci = deep.science || [];
    const sciAlts = [...sciData, ...deepSci].slice(0,3);
    const sci = sciAlts[sciId];
    if(sci && enEl) {
      enEl.textContent += `  — [Science lens: ${sci.topic} — ${sci.sci}]`;
      bnEl.textContent += `  — [বিজ্ঞান দৃষ্টিকোণ: ${sci.topic}]`;
    }
  };
  window.BuilderSave = function(n){
    const picks={};
    document.querySelectorAll(`#wb-${n} [data-idx]`).forEach(card=>{
      const wi=parseInt(card.dataset.idx);
      const act=card.querySelector('button.active');
      picks[wi]= act ? parseInt(act.dataset.a) : 0;
    });
    const sciEl=document.querySelector(`#sci-${n} input:checked`);
    const sci=sciEl? parseInt(sciEl.value):0;
    localStorage.setItem(`builder-${n}`, JSON.stringify({picks,sci,ts:Date.now()}));
    const msg=document.getElementById(`builder-msg-${n}`);
    if(msg){ msg.textContent='Saved ✓'; setTimeout(()=>msg.textContent='',1500); }
  };
  window.BuilderReset = function(n){
    localStorage.removeItem(`builder-${n}`);
    document.querySelectorAll(`#wb-${n} button`).forEach(b=> b.classList.remove('active'));
    document.querySelectorAll(`#wb-${n} [data-idx]`).forEach(card=>{
      const first=card.querySelector('button');
      if(first) first.classList.add('active');
    });
    document.querySelectorAll(`#sci-${n} .sci-opt`).forEach((el,i)=> el.classList.toggle('active', i===0));
    const r=document.querySelector(`#sci-${n} input[value="0"]`); if(r) r.checked=true;
    BuilderUpdate(n);
  };
  window.BuilderShare = function(n){
    const picks={};
    document.querySelectorAll(`#wb-${n} [data-idx]`).forEach(card=>{
      const wi=parseInt(card.dataset.idx);
      const act=card.querySelector('button.active');
      picks[wi]= act ? parseInt(act.dataset.a) : 0;
    });
    const arr=Object.keys(picks).sort((a,b)=>a-b).map(k=>picks[k]).join(',');
    const url = location.origin + location.pathname + `#b${n}=${arr}`;
    navigator.clipboard.writeText(url).then(()=>{
      const m=document.getElementById(`builder-msg-${n}`);
      if(m){ m.textContent='Link copied ✓'; setTimeout(()=>m.textContent='',1500); }
    });
  };

  window.renderBuilder = renderBuilder;
  document.addEventListener('DOMContentLoaded', ()=>{
    document.querySelectorAll('[id^="builder-"]').forEach(el=>{
      const n=parseInt(el.id.split('-')[1]);
      renderBuilder(n);
    });
  });
})();