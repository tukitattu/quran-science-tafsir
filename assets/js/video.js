/* YouTube lazy-facade player — related videos for surah pages.
   Renders a thumbnail + play button; the actual iframe (youtube-nocookie, rel=0)
   is created only on click, so pages stay fast and private until the user asks.
   Thumbnails are static images; YouTube JS never loads until play is pressed.
*/
window.VT = (function(){
  const CH = window.VIDEO_CHANNELS || {};

  function esc(s){ const d=document.createElement('div'); d.textContent = s==null?'':String(s); return d.innerHTML; }

  function watchUrl(id, ts){
    return 'https://www.youtube.com/watch?v=' + encodeURIComponent(id) + (ts ? ('&t=' + Math.floor(ts) + 's') : '');
  }

  function channelMeta(key){
    return CH[key] || { name:'YouTube', url:'https://www.youtube.com/', videos:'https://www.youtube.com/', handle:'' };
  }

  function cardHTML(item){
    const ts = Math.max(0, Math.floor(item.timestamp || 0));
    const ch = channelMeta(item.channel || 'qdd');
    const thumb = 'https://i.ytimg.com/vi/' + encodeURIComponent(item.youtubeId) + '/hqdefault.jpg';
    return `
      <figure class="yt-card" data-vid="${esc(item.youtubeId)}" data-ts="${ts}">
        <button class="yt-facade" type="button" aria-label="Play video: ${esc(item.title)}">
          <img class="yt-thumb" loading="lazy" decoding="async" src="${esc(thumb)}" alt="${esc(item.title)}" onerror="this.onerror=null;this.src='https://i.ytimg.com/vi/${esc(item.youtubeId)}/mqdefault.jpg'">
          <span class="yt-play" aria-hidden="true">
            <svg viewBox="0 0 68 48" width="56" height="40"><path class="yt-play-bg" d="M66.5 7.7a8.6 8.6 0 0 0-.6-3.1 7.1 7.1 0 0 0-2.7-4C60.8.6 57.8 0 53.8 0H14.2C10.2 0 7.2.6 4.9 1.6a7.1 7.1 0 0 0-4 1.9A8.6 8.6 0 0 0 .3 4.8C0 6 0 8 0 12.4v23.2C0 40.3 0 42 0.3 43a8.6 8.6 0 0 0 .6 3.2 7.1 7.1 0 0 0 4 4c2 .9 5 1.5 9 1.5h39.6c4 0 7-.6 8.9-1.6a7.1 7.1 0 0 0 4.6-4.8c.3-1 .3-3 .3-6.9V12.5c0-3.1 0-4.8-.3-4.8z" fill="#cc0000" fill-opacity="0.9"/><path d="M46 24.2 26 12.6v23.2L46 24.2z" fill="#fff"/></svg>
          </span>
          <span class="yt-dur" hidden></span>
        </button>
        <figcaption class="yt-meta">
          <span class="yt-title">${esc(item.title)}</span>
          <span class="yt-sub">${esc(item.ayah||'')}${item.topic ? ' · ' + esc(item.topic) : ''}</span>
          <span class="yt-channel"><a href="${esc(ch.videos)}" target="_blank" rel="noopener">${esc(ch.name)}</a> <span aria-hidden="true">·</span> <a href="${esc(watchUrl(item.youtubeId, ts))}" target="_blank" rel="noopener">YouTube ↗</a></span>
        </figcaption>
      </figure>`;
  }

  function frameHTML(id, ts, title){
    const src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id)
      + '?autoplay=1&rel=0&modestbranding=1' + (ts ? '&start=' + Math.floor(ts) : '');
    return `<iframe class="yt-frame" src="${esc(src)}" title="${esc(title)}"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowfullscreen loading="lazy" referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
  }

  function bindFacade(card){
    const btn = card.querySelector('.yt-facade');
    if(!btn) return;
    btn.addEventListener('click', function(){
      const id = card.getAttribute('data-vid');
      const ts = parseInt(card.getAttribute('data-ts') || '0', 10);
      const title = (btn.getAttribute('aria-label') || '').replace(/^Play video: /, '');
      card.querySelector('.yt-facade').outerHTML = frameHTML(id, ts, title);
      card.classList.add('yt-playing');
    });
  }

  /** Render a list of {ayah,title,youtubeId,timestamp,topic,channel} into a container. */
  function render(container, items){
    if(!container) return;
    const valid = (items||[]).filter(i => i && i.youtubeId && /^[A-Za-z0-9_-]{6,20}$/.test(i.youtubeId));
    container.innerHTML = valid.length
      ? valid.map(cardHTML).join('')
      : '';
    container.querySelectorAll('.yt-card').forEach(bindFacade);
    return valid.length;
  }

  /** Render the two-channel "no videos yet" footer with links to both channels. */
  function renderChannelLinks(el){
    if(!el) return;
    el.innerHTML = '<p class="small" style="color:var(--muted)">No videos from the two channels mapped to this surah yet.<br>Watch on: '
      + ['nak','qdd'].map(k => {
          const c = channelMeta(k);
          return `<a href="${esc(c.videos)}" target="_blank" rel="noopener" style="color:var(--accent2)">${esc(c.name)}</a>`;
        }).join(' · ')
      + '</p>';
  }

  return { render, renderChannelLinks, watchUrl };
})();
