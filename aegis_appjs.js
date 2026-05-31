// ═══════════════════════════════════════
//  AEGIS — Main App Entry Point
// ═══════════════════════════════════════

/* ── Tab Navigation ── */
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
  });
});

/* ── Clock ── */
function updateClock() {
  const now = new Date();
  document.getElementById('clock').textContent =
    now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}
updateClock();
setInterval(updateClock, 1000);

/* ── Settings Module (inline, simple) ── */
const Settings = {
  saveKey() {
    const val = document.getElementById('api-key-input').value.trim();
    if (val) { localStorage.setItem('aegis_api_key', val); alert('✓ API ключ сохранён'); }
  },
  saveYtKey() {
    const val = document.getElementById('yt-key-input').value.trim();
    if (val) { localStorage.setItem('aegis_yt_key', val); alert('✓ YouTube ключ сохранён'); }
  },
  saveUsername() {
    const val = document.getElementById('username-input').value.trim();
    if (val) { localStorage.setItem('aegis_username', val); alert(`✓ Привет, ${val}!`); }
  },
  clearAll() {
    if (confirm('Удалить ВСЕ данные AEGIS? Это действие необратимо.')) {
      localStorage.clear(); location.reload();
    }
  },
  init() {
    // Pre-fill saved values (mask keys)
    const apiKey = localStorage.getItem('aegis_api_key');
    if (apiKey) document.getElementById('api-key-input').placeholder = '••••••••• (сохранён)';
    const ytKey = localStorage.getItem('aegis_yt_key');
    if (ytKey) document.getElementById('yt-key-input').placeholder = '••••••••• (сохранён)';
    const username = localStorage.getItem('aegis_username');
    if (username) document.getElementById('username-input').value = username;
    const voiceLang = localStorage.getItem('aegis_voice_lang');
    if (voiceLang) document.getElementById('voice-lang').value = voiceLang;
    document.getElementById('voice-lang').addEventListener('change', e => {
      localStorage.setItem('aegis_voice_lang', e.target.value);
    });
  }
};

/* ── Init all modules ── */
document.addEventListener('DOMContentLoaded', () => {
  Settings.init();
  Chat.init();
  Voice.init();
  Tasks.init();
  YouTube.init();
  Analytics.init();
  console.log('%cAEGIS ONLINE', 'color:#4fc3f7;font-size:16px;font-weight:bold;letter-spacing:4px');
});
