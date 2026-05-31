// ═══════════════════════════════════════
//  AEGIS — YouTube Monitor Module
// ═══════════════════════════════════════

const YouTube = (() => {
  let channels = [];

  function getYtKey() { return localStorage.getItem('aegis_yt_key') || ''; }
  function getApiKey() { return localStorage.getItem('aegis_api_key') || ''; }

  function load() {
    try { channels = JSON.parse(localStorage.getItem('aegis_yt_channels') || '[]'); } catch { channels = []; }
  }

  function save() { localStorage.setItem('aegis_yt_channels', JSON.stringify(channels)); }

  function renderChannels() {
    const ul = document.getElementById('yt-channels');
    ul.innerHTML = '';
    channels.forEach((ch, i) => {
      const li = document.createElement('li');
      li.innerHTML = `
        <span>📺</span>
        <span class="item-text">${ch.name || ch.id}</span>
        <button onclick="YouTube.fetchVideos(${i})">🔄 Обновить</button>
        <button class="del-btn" onclick="YouTube.deleteChannel(${i})">✕</button>`;
      ul.appendChild(li);
    });
  }

  async function addChannel() {
    const inp = document.getElementById('yt-channel-input');
    const raw = inp.value.trim();
    if (!raw) return;

    const ytKey = getYtKey();
    if (!ytKey) {
      alert('Добавь YouTube API ключ в Настройках.\nПолучи его на console.cloud.google.com → YouTube Data API v3');
      return;
    }

    // Resolve channel ID from handle or ID
    let channelId = raw;
    let name = raw;

    // If handle (@name) or channel name — search for it
    if (raw.startsWith('@') || !raw.startsWith('UC')) {
      try {
        const query = raw.startsWith('@') ? raw.slice(1) : raw;
        const r = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(query)}&key=${ytKey}`);
        const d = await r.json();
        if (d.items && d.items.length > 0) {
          channelId = d.items[0].snippet.channelId;
          name = d.items[0].snippet.channelTitle;
        }
      } catch (e) { console.error('YT channel resolve:', e); }
    }

    channels.push({ id: channelId, name, lastFetched: null, videos: [] });
    inp.value = '';
    save(); renderChannels();
    fetchVideos(channels.length - 1);
  }

  async function fetchVideos(idx) {
    const ch = channels[idx];
    const ytKey = getYtKey();
    if (!ytKey) { alert('YouTube API ключ не указан.'); return; }

    try {
      const r = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${ch.id}&order=date&maxResults=6&type=video&key=${ytKey}`
      );
      const d = await r.json();
      if (d.error) { alert('YouTube API ошибка: ' + d.error.message); return; }
      ch.videos = (d.items || []).map(v => ({
        id: v.id.videoId,
        title: v.snippet.title,
        thumb: v.snippet.thumbnails.medium.url,
        published: v.snippet.publishedAt,
        description: v.snippet.description
      }));
      ch.lastFetched = Date.now();
      save(); renderFeed();
    } catch (e) { alert('Ошибка загрузки видео: ' + e.message); }
  }

  function renderFeed() {
    const feed = document.getElementById('yt-feed');
    feed.innerHTML = '';
    const allVideos = channels.flatMap(ch =>
      ch.videos.map(v => ({ ...v, channelName: ch.name }))
    ).sort((a, b) => new Date(b.published) - new Date(a.published));

    if (!allVideos.length) {
      feed.innerHTML = '<p style="color:var(--muted)">Нет видео. Добавь каналы и нажми «Обновить».</p>';
      return;
    }

    allVideos.forEach(v => {
      const card = document.createElement('div');
      card.className = 'yt-card';
      const date = new Date(v.published).toLocaleDateString('ru-RU');
      card.innerHTML = `
        <a href="https://youtube.com/watch?v=${v.id}" target="_blank">
          <img src="${v.thumb}" alt="${v.title}" loading="lazy"/>
        </a>
        <div class="yt-card-body">
          <p class="yt-card-title">${v.title}</p>
          <p class="yt-card-meta">${v.channelName} · ${date}</p>
          <div class="yt-card-summary" id="sum-${v.id}">
            <button onclick="YouTube.summarize('${v.id}', \`${v.title.replace(/`/g, '')}\`, \`${v.description.slice(0, 800).replace(/`/g, '')}\`)" style="padding:4px 8px;font-size:10px">🤖 Саммари</button>
          </div>
        </div>`;
      feed.appendChild(card);
    });
  }

  async function summarize(videoId, title, description) {
    const key = getApiKey();
    if (!key) { alert('Добавь Anthropic API ключ в Настройках.'); return; }

    const sumDiv = document.getElementById(`sum-${videoId}`);
    sumDiv.innerHTML = '<div class="thinking"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>';

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 300,
          messages: [{
            role: 'user',
            content: `Based on this YouTube lecture title and description, provide a 3-bullet summary of likely key topics covered, and suggest what prerequisite topics to review first. Be concise. Respond in Russian.\n\nTitle: ${title}\nDescription: ${description}`
          }]
        })
      });
      const data = await res.json();
      sumDiv.innerHTML = `<p class="yt-card-summary">${marked(data.content[0].text)}</p>`;
    } catch (e) {
      sumDiv.innerHTML = `<p style="color:var(--danger);font-size:11px">Ошибка: ${e.message}</p>`;
    }
  }

  function deleteChannel(i) { channels.splice(i, 1); save(); renderChannels(); renderFeed(); }

  function init() { load(); renderChannels(); renderFeed(); }

  return { init, addChannel, fetchVideos, summarize, deleteChannel };
})();
