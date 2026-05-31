// ═══════════════════════════════════════
//  AEGIS — Voice Module (Web Speech API)
// ═══════════════════════════════════════

const Voice = (() => {
  let recognition = null;
  let isListening = false;

  function getLang() {
    return localStorage.getItem('aegis_voice_lang') || 'ru-RU';
  }

  function init() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('AEGIS Voice: SpeechRecognition not supported in this browser.');
      const btn = document.getElementById('voice-btn');
      if (btn) { btn.title = 'Голосовой ввод не поддерживается в этом браузере'; btn.style.opacity = '0.4'; }
      return;
    }

    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (e) => {
      const transcript = Array.from(e.results)
        .map(r => r[0].transcript).join('');
      document.getElementById('chat-input').value = transcript;
    };

    recognition.onend = () => {
      isListening = false;
      updateBtn();
      // Auto-send if we got something
      const val = document.getElementById('chat-input').value.trim();
      if (val) {
        Chat.send(val);
        document.getElementById('chat-input').value = '';
      }
    };

    recognition.onerror = (e) => {
      console.error('Voice error:', e.error);
      isListening = false;
      updateBtn();
    };

    document.getElementById('voice-btn').addEventListener('click', toggle);
  }

  function toggle() {
    if (!recognition) return;
    recognition.lang = getLang();
    if (isListening) {
      recognition.stop();
    } else {
      recognition.start();
      isListening = true;
      updateBtn();
    }
  }

  function updateBtn() {
    const btn = document.getElementById('voice-btn');
    if (!btn) return;
    if (isListening) {
      btn.classList.add('recording');
      btn.title = 'Слушаю... (нажми чтобы остановить)';
    } else {
      btn.classList.remove('recording');
      btn.title = 'Голосовой ввод';
    }
  }

  return { init };
})();
