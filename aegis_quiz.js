// ═══════════════════════════════════════
//  AEGIS — Quiz Module
// ═══════════════════════════════════════

const Quiz = (() => {
  let currentQuiz = null;
  let answers = [];

  async function generate() {
    const key = localStorage.getItem('aegis_api_key') || '';
    if (!key) { alert('Добавь API ключ в Настройках.'); return; }

    const topic = document.getElementById('quiz-topic').value.trim();
    const type  = document.getElementById('quiz-type').value;
    const count = document.getElementById('quiz-count').value;
    if (!topic) { alert('Введи тему или текст для квиза.'); return; }

    const area = document.getElementById('quiz-area');
    area.innerHTML = '<div class="thinking"><div class="dot"></div><div class="dot"></div><div class="dot"></div><span>Генерирую квиз...</span></div>';

    const typeMap = { mcq: 'multiple choice (A/B/C/D)', truefalse: 'true/false', open: 'open-ended' };
    const prompt = `Generate a ${count}-question ${typeMap[type]} quiz on the following topic/text.
Return ONLY a valid JSON array (no markdown, no explanation):
[
  {
    "question": "...",
    "type": "${type}",
    "options": ["A. ...", "B. ...", "C. ...", "D. ..."],  // omit for open
    "answer": "A",   // for open: a model answer string
    "explanation": "Brief explanation"
  }
]
Topic/text: ${topic}`;

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
          max_tokens: 2000,
          messages: [{ role: 'user', content: prompt }]
        })
      });
      const data = await res.json();
      const text = data.content[0].text.replace(/```json|```/g, '').trim();
      currentQuiz = JSON.parse(text);
      answers = new Array(currentQuiz.length).fill(null);
      render();
    } catch (err) {
      area.innerHTML = `<p style="color:var(--danger)">Ошибка: ${err.message}</p>`;
    }
  }

  function render() {
    const area = document.getElementById('quiz-area');
    if (!currentQuiz) return;
    area.innerHTML = '';

    currentQuiz.forEach((q, qi) => {
      const div = document.createElement('div');
      div.className = 'quiz-question';
      div.id = `q-${qi}`;
      div.innerHTML = `<h4>${qi + 1}. ${q.question}</h4>`;

      if (q.type === 'open') {
        div.innerHTML += `<textarea class="open-answer" id="open-${qi}" placeholder="Твой ответ..." rows="3"></textarea>`;
      } else {
        const opts = q.options || (q.type === 'truefalse' ? ['Правда', 'Ложь'] : []);
        const optsHtml = opts.map((o, oi) =>
          `<div class="quiz-option" data-qi="${qi}" data-oi="${oi}" onclick="Quiz.select(${qi}, ${oi})">${o}</div>`
        ).join('');
        div.innerHTML += `<div class="quiz-options">${optsHtml}</div>`;
      }
      area.appendChild(div);
    });

    const submitBtn = document.createElement('button');
    submitBtn.textContent = '✓ Проверить ответы';
    submitBtn.style.marginTop = '16px';
    submitBtn.onclick = check;
    area.appendChild(submitBtn);
  }

  function select(qi, oi) {
    answers[qi] = oi;
    // Visual update
    document.querySelectorAll(`[data-qi="${qi}"]`).forEach(el => el.classList.remove('selected'));
    document.querySelector(`[data-qi="${qi}"][data-oi="${oi}"]`).classList.add('selected');
  }

  function check() {
    let correct = 0;
    currentQuiz.forEach((q, qi) => {
      const qDiv = document.getElementById(`q-${qi}`);
      if (q.type === 'open') {
        // Just show model answer for open questions
        const ta = document.getElementById(`open-${qi}`);
        ta.disabled = true;
        const ans = document.createElement('p');
        ans.style.cssText = 'color:var(--accent2);font-size:12px;margin-top:8px';
        ans.textContent = `💡 Образцовый ответ: ${q.answer}`;
        qDiv.appendChild(ans);
        correct++; // count all open as correct (self-assessed)
      } else {
        const opts = qDiv.querySelectorAll('.quiz-option');
        const correctIdx = q.type === 'truefalse'
          ? (q.answer === 'Правда' || q.answer === 'True' || q.answer === true ? 0 : 1)
          : q.answer.charCodeAt(0) - 65; // A=0, B=1...

        opts.forEach((o, i) => { o.onclick = null; });

        if (answers[qi] === correctIdx) {
          opts[correctIdx]?.classList.add('correct');
          correct++;
        } else {
          if (answers[qi] !== null) opts[answers[qi]]?.classList.add('wrong');
          opts[correctIdx]?.classList.add('correct');
        }

        if (q.explanation) {
          const exp = document.createElement('p');
          exp.style.cssText = 'color:var(--text-dim);font-size:11px;margin-top:8px;padding:6px;border-left:2px solid var(--border)';
          exp.textContent = q.explanation;
          qDiv.appendChild(exp);
        }
      }
    });

    const result = document.createElement('div');
    result.className = 'quiz-result';
    const pct = Math.round((correct / currentQuiz.length) * 100);
    result.innerHTML = `🏆 Результат: ${correct}/${currentQuiz.length} (${pct}%) ${pct >= 80 ? '— Отлично!' : pct >= 60 ? '— Хорошо!' : '— Нужно повторить.'}`;
    document.getElementById('quiz-area').appendChild(result);

    // Save to analytics
    Analytics?.recordQuiz(pct);
  }

  return { generate, select };
})();
