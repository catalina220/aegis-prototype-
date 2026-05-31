// ═══════════════════════════════════════
//  AEGIS — Analytics Module
// ═══════════════════════════════════════

const Analytics = (() => {
  let data = { subjects: [], quizHistory: [], sessionStart: null, totalMessages: 0 };
  let timers = {}; // active timers per subject index

  function load() {
    try { data = JSON.parse(localStorage.getItem('aegis_analytics') || '{}'); } catch {}
    data.subjects     = data.subjects     || [];
    data.quizHistory  = data.quizHistory  || [];
    data.totalMessages = data.totalMessages || 0;
    data.sessionStart = Date.now();
  }

  function save() { localStorage.setItem('aegis_analytics', JSON.stringify(data)); }

  /* ── Subjects & Time Tracking ── */
  function addSubject() {
    const inp = document.getElementById('subject-input');
    const name = inp.value.trim();
    if (!name || data.subjects.find(s => s.name === name)) return;
    data.subjects.push({ name, totalMinutes: 0, sessions: [] });
    inp.value = '';
    save(); renderSubjects(); Tasks.updateSubjectSelect?.();
  }

  function startTimer(i) {
    if (timers[i]) return; // already running
    timers[i] = { start: Date.now(), interval: setInterval(() => renderSubjects(), 10000) };
    renderSubjects();
  }

  function stopTimer(i) {
    if (!timers[i]) return;
    const elapsed = Math.round((Date.now() - timers[i].start) / 60000); // minutes
    clearInterval(timers[i].interval);
    delete timers[i];
    data.subjects[i].totalMinutes += elapsed;
    data.subjects[i].sessions.push({ date: Date.now(), minutes: elapsed });
    save(); renderSubjects(); renderProgress();
  }

  function renderSubjects() {
    const el = document.getElementById('subjects-list');
    if (!el) return;
    el.innerHTML = '';
    data.subjects.forEach((s, i) => {
      const running = !!timers[i];
      const liveMin = running ? Math.round((Date.now() - timers[i].start) / 60000) : 0;
      const total = s.totalMinutes + liveMin;
      const div = document.createElement('div');
      div.className = 'subject-row';
      div.innerHTML = `
        <span class="subject-name">${s.name}</span>
        <span class="subject-hours">${formatTime(total)}</span>
        <button class="timer-btn ${running ? 'running' : ''}" onclick="Analytics.${running ? 'stop' : 'start'}Timer(${i})">
          ${running ? '⏹ Стоп' : '▶ Старт'}
        </button>
        <button class="del-btn" onclick="Analytics.deleteSubject(${i})">✕</button>`;
      el.appendChild(div);
    });
  }

  function deleteSubject(i) {
    stopTimer(i);
    data.subjects.splice(i, 1);
    save(); renderSubjects();
  }

  function formatTime(mins) {
    if (mins < 60) return `${mins} мин`;
    return `${Math.floor(mins/60)}ч ${mins%60}м`;
  }

  /* ── Quiz History ── */
  function recordQuiz(score) {
    data.quizHistory.push({ date: Date.now(), score });
    save(); renderProgress();
  }

  function recordMessage() {
    data.totalMessages++;
    save();
  }

  /* ── Progress Panel ── */
  function renderProgress() {
    const el = document.getElementById('progress-stats');
    if (!el) return;

    const totalStudyTime = data.subjects.reduce((s, x) => s + x.totalMinutes, 0);
    const quizAvg = data.quizHistory.length
      ? Math.round(data.quizHistory.reduce((s, q) => s + q.score, 0) / data.quizHistory.length)
      : null;

    const topSubject = [...data.subjects].sort((a, b) => b.totalMinutes - a.totalMinutes)[0];

    el.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:12px">
        <div>
          <p style="color:var(--muted);font-size:11px">ВСЕГО ВРЕМЕНИ ЗА УЧЁБОЙ</p>
          <p style="color:var(--accent);font-size:20px">${formatTime(totalStudyTime)}</p>
        </div>
        <div>
          <p style="color:var(--muted);font-size:11px">СРЕДНИЙ БАЛЛ КВИЗОВ</p>
          <p style="color:var(--accent2);font-size:20px">${quizAvg !== null ? quizAvg + '%' : '—'}</p>
          <div class="progress-bar-wrap"><div class="progress-bar" style="width:${quizAvg || 0}%"></div></div>
        </div>
        <div>
          <p style="color:var(--muted);font-size:11px">ОСНОВНОЙ ПРЕДМЕТ</p>
          <p style="color:var(--text)">${topSubject ? topSubject.name + ' (' + formatTime(topSubject.totalMinutes) + ')' : '—'}</p>
        </div>
        <div>
          <p style="color:var(--muted);font-size:11px">КВИЗОВ ПРОЙДЕНО</p>
          <p style="color:var(--text)">${data.quizHistory.length}</p>
        </div>
        <div>
          <p style="color:var(--muted);font-size:11px">СООБЩЕНИЙ AEGIS</p>
          <p style="color:var(--text)">${data.totalMessages}</p>
        </div>
      </div>`;
  }

  /* ── AI Recommendations ── */
  async function getRecommendations() {
    const key = localStorage.getItem('aegis_api_key') || '';
    if (!key) { alert('Добавь API ключ в Настройках.'); return; }

    const out = document.getElementById('recommendations-output');
    out.innerHTML = '<div class="thinking"><div class="dot"></div><div class="dot"></div><div class="dot"></div><span>Анализирую данные...</span></div>';

    const tasksData = Tasks.getData();
    const summary = {
      subjects: data.subjects.map(s => ({ name: s.name, totalMinutes: s.totalMinutes, sessions: s.sessions.length })),
      openTasks: tasksData.tasks.filter(t => !t.done).length,
      quizHistory: data.quizHistory.slice(-10),
      goals: tasksData.goals.map(g => g.text)
    };

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
          max_tokens: 600,
          messages: [{
            role: 'user',
            content: `You are AEGIS study assistant. Analyze this student's data and give 3-5 specific, actionable recommendations. Focus on: which subject needs more time, quiz performance trends, and study balance. Be direct. Respond in Russian.\n\nData: ${JSON.stringify(summary)}`
          }]
        })
      });
      const d = await res.json();
      out.innerHTML = `<div style="margin-top:12px">${marked(d.content[0].text)}</div>`;
    } catch (e) {
      out.innerHTML = `<p style="color:var(--danger)">Ошибка: ${e.message}</p>`;
    }
  }

  function getSubjects() { return data.subjects; }

  /* ── Session timer in footer ── */
  function startSessionClock() {
    setInterval(() => {
      const mins = Math.round((Date.now() - data.sessionStart) / 60000);
      const el = document.getElementById('footer-session');
      if (el) el.textContent = `Сессия: ${mins} мин`;
    }, 30000);
  }

  function init() { load(); renderSubjects(); renderProgress(); startSessionClock(); }

  return { init, addSubject, startTimer, stopTimer, deleteSubject, recordQuiz, recordMessage, getRecommendations, getSubjects };
})();
