// ═══════════════════════════════════════
//  AEGIS — Chat Module (Claude API)
// ═══════════════════════════════════════

const Chat = (() => {
  const SYSTEM_PROMPT = `You are AEGIS (Adaptive Educational Guide & Intelligent System) — a personal AI study assistant.
You are precise, intelligent, and helpful. Your tone is formal but warm — like JARVIS from Iron Man, adapted for studying.
You help the user understand topics, create study plans, explain concepts, check answers, and suggest what to study next.
Respond in the same language the user writes in (Russian or English).
Be concise but thorough. Use markdown formatting when helpful (lists, code blocks, bold for key terms).
The user's name: ${() => localStorage.getItem('aegis_username') || 'Пользователь'}.`;

  let history = [];

  function getKey() {
    return localStorage.getItem('aegis_api_key') || '';
  }

  function appendMessage(role, content) {
    const el = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.className = `message ${role === 'user' ? 'user' : 'aegis'}`;
    div.innerHTML = `
      <span class="msg-label">${role === 'user' ? 'ВЫ' : 'AEGIS'}</span>
      <div>${marked(content)}</div>
    `;
    el.appendChild(div);
    el.scrollTop = el.scrollHeight;
    return div;
  }

  function showThinking() {
    const el = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.className = 'message aegis';
    div.id = 'thinking-indicator';
    div.innerHTML = `
      <span class="msg-label">AEGIS</span>
      <div class="thinking">
        <div class="dot"></div><div class="dot"></div><div class="dot"></div>
        <span>Обрабатываю запрос...</span>
      </div>`;
    el.appendChild(div);
    el.scrollTop = el.scrollHeight;
  }

  function removeThinking() {
    document.getElementById('thinking-indicator')?.remove();
  }

  async function send(userText) {
    const key = getKey();
    if (!key) {
      appendMessage('aegis', '⚠️ API ключ не указан. Перейди в **Настройки** и добавь свой Anthropic API ключ.');
      return;
    }
    if (!userText.trim()) return;

    appendMessage('user', userText);
    history.push({ role: 'user', content: userText });
    showThinking();

    // Track session time for analytics
    Analytics?.recordMessage();

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
          max_tokens: 1500,
          system: SYSTEM_PROMPT,
          messages: history.slice(-20) // keep context window manageable
        })
      });

      const data = await res.json();
      removeThinking();

      if (data.error) {
        appendMessage('aegis', `❌ Ошибка API: ${data.error.message}`);
        history.pop();
        return;
      }

      const reply = data.content[0].text;
      history.push({ role: 'assistant', content: reply });
      appendMessage('aegis', reply);

      // Save history to localStorage
      localStorage.setItem('aegis_chat_history', JSON.stringify(history.slice(-40)));
    } catch (err) {
      removeThinking();
      appendMessage('aegis', `❌ Ошибка соединения: ${err.message}`);
      history.pop();
    }
  }

  function init() {
    // Restore chat history
    const saved = localStorage.getItem('aegis_chat_history');
    if (saved) {
      try {
        history = JSON.parse(saved);
        // Render last 10 messages
        const msgs = document.getElementById('chat-messages');
        msgs.innerHTML = '';
        history.slice(-10).forEach(m => appendMessage(m.role === 'user' ? 'user' : 'aegis', m.content));
      } catch { history = []; }
    }

    // Send button
    document.getElementById('send-btn').addEventListener('click', () => {
      const inp = document.getElementById('chat-input');
      send(inp.value);
      inp.value = '';
    });

    // Enter to send (Shift+Enter for newline)
    document.getElementById('chat-input').addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const inp = e.target;
        send(inp.value);
        inp.value = '';
      }
    });

    // Quick commands
    document.querySelectorAll('.qcmd').forEach(btn => {
      btn.addEventListener('click', () => {
        const inp = document.getElementById('chat-input');
        inp.value = btn.dataset.cmd + ' ';
        inp.focus();
      });
    });
  }

  return { init, send };
})();

// Simple marked.js shim — renders **bold**, `code`, and newlines
// For production, replace with the real marked.js CDN
function marked(text) {
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>');
}
