// ═══════════════════════════════════════
//  AEGIS — Tasks & Goals Module
// ═══════════════════════════════════════

const Tasks = (() => {
  let data = { goals: [], tasks: [], files: [], subjects: [] };

  function load() {
    try { data = JSON.parse(localStorage.getItem('aegis_tasks') || '{}'); } catch {}
    data.goals    = data.goals    || [];
    data.tasks    = data.tasks    || [];
    data.files    = data.files    || [];
    data.subjects = data.subjects || [];
  }

  function save() {
    localStorage.setItem('aegis_tasks', JSON.stringify(data));
    updateFooter();
  }

  function updateFooter() {
    const open = data.tasks.filter(t => !t.done).length;
    document.getElementById('footer-tasks').textContent = `Задач: ${open}`;
  }

  /* ── Goals ── */
  function renderGoals() {
    const ul = document.getElementById('goals-list');
    ul.innerHTML = '';
    data.goals.forEach((g, i) => {
      const li = document.createElement('li');
      if (g.done) li.classList.add('done');
      li.innerHTML = `
        <input type="checkbox" ${g.done ? 'checked' : ''} onchange="Tasks.toggleGoal(${i})"/>
        <span class="item-text">${g.text}</span>
        <button class="del-btn" onclick="Tasks.deleteGoal(${i})">✕</button>`;
      ul.appendChild(li);
    });
  }

  function addGoal() {
    const inp = document.getElementById('goal-input');
    const text = inp.value.trim();
    if (!text) return;
    data.goals.push({ text, done: false, created: Date.now() });
    inp.value = '';
    save(); renderGoals();
  }

  function toggleGoal(i) {
    data.goals[i].done = !data.goals[i].done;
    save(); renderGoals();
  }

  function deleteGoal(i) {
    data.goals.splice(i, 1);
    save(); renderGoals();
  }

  /* ── Tasks ── */
  function renderTasks() {
    const ul = document.getElementById('tasks-list');
    ul.innerHTML = '';
    data.tasks.forEach((t, i) => {
      const li = document.createElement('li');
      if (t.done) li.classList.add('done');
      li.innerHTML = `
        <input type="checkbox" ${t.done ? 'checked' : ''} onchange="Tasks.toggleTask(${i})"/>
        <span class="item-text">${t.text}${t.subject ? ` <small style="color:var(--muted)">[${t.subject}]</small>` : ''}</span>
        <button class="del-btn" onclick="Tasks.deleteTask(${i})">✕</button>`;
      ul.appendChild(li);
    });
    updateSubjectSelect();
  }

  function addTask() {
    const inp = document.getElementById('task-input');
    const sub = document.getElementById('task-subject');
    const text = inp.value.trim();
    if (!text) return;
    data.tasks.push({ text, subject: sub.value, done: false, created: Date.now() });
    inp.value = '';
    save(); renderTasks();
  }

  function toggleTask(i) {
    data.tasks[i].done = !data.tasks[i].done;
    save(); renderTasks();
  }

  function deleteTask(i) {
    data.tasks.splice(i, 1);
    save(); renderTasks();
  }

  /* ── Subjects dropdown sync ── */
  function updateSubjectSelect() {
    const sel = document.getElementById('task-subject');
    const subjects = Analytics?.getSubjects() || data.subjects || [];
    sel.innerHTML = '<option value="">Предмет...</option>';
    subjects.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.name; opt.textContent = s.name;
      sel.appendChild(opt);
    });
  }

  /* ── Files ── */
  function renderFiles() {
    const ul = document.getElementById('files-list');
    ul.innerHTML = '';
    data.files.forEach((f, i) => {
      const li = document.createElement('li');
      li.innerHTML = `
        <span>📄</span>
        <span class="item-text">${f.name} <small style="color:var(--muted)">(${(f.size/1024).toFixed(1)} KB)</small></span>
        <button onclick="Tasks.sendToChat(${i})">💬 В чат</button>
        <button class="del-btn" onclick="Tasks.deleteFile(${i})">✕</button>`;
      ul.appendChild(li);
    });
  }

  function handleFiles(fileList) {
    Array.from(fileList).forEach(file => {
      const reader = new FileReader();
      reader.onload = e => {
        data.files.push({ name: file.name, size: file.size, content: e.target.result, added: Date.now() });
        save(); renderFiles();
      };
      reader.readAsText(file);
    });
  }

  function deleteFile(i) { data.files.splice(i, 1); save(); renderFiles(); }

  function sendToChat(i) {
    const f = data.files[i];
    const preview = f.content.slice(0, 2000);
    document.getElementById('chat-input').value = `Проанализируй этот материал:\n\n${preview}`;
    // Switch to chat tab
    document.querySelector('.nav-btn[data-tab="chat"]').click();
  }

  function getData() { return data; }

  function init() {
    load(); renderGoals(); renderTasks(); renderFiles(); updateFooter();

    const area = document.getElementById('upload-area');
    const inp  = document.getElementById('file-input');
    area.addEventListener('click', () => inp.click());
    inp.addEventListener('change', e => handleFiles(e.target.files));
    area.addEventListener('dragover', e => { e.preventDefault(); area.classList.add('dragover'); });
    area.addEventListener('dragleave', () => area.classList.remove('dragover'));
    area.addEventListener('drop', e => { e.preventDefault(); area.classList.remove('dragover'); handleFiles(e.dataTransfer.files); });
  }

  return { init, addGoal, toggleGoal, deleteGoal, addTask, toggleTask, deleteTask, deleteFile, sendToChat, getData, updateSubjectSelect };
})();
