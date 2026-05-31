# 🛡️ AEGIS
**Adaptive Educational Guide & Intelligent System**

Personal AI study assistant with HUD interface, voice input, quizzes, YouTube monitoring, and study analytics.

---

## 🚀 Quick Start (GitHub Pages — бесплатно)

### 1. Создай репозиторий
```bash
git init aegis
cd aegis
# скопируй все файлы проекта сюда
git add .
git commit -m "init: AEGIS v0.1.0"
```

### 2. Залей на GitHub
```bash
gh repo create aegis --public --push
# или через github.com → New repository → upload files
```

### 3. Включи GitHub Pages
`Settings → Pages → Source: Deploy from branch → main → / (root) → Save`

Через минуту сайт будет на: `https://ИМЯ_ПОЛЬЗОВАТЕЛЯ.github.io/aegis`

---

## 🔑 API Ключи (настроить после запуска)

### Anthropic API Key (для ИИ-чата и квизов)
1. [console.anthropic.com](https://console.anthropic.com) → API Keys → Create Key
2. В AEGIS → Настройки → вставь ключ

### YouTube Data API Key (для мониторинга лекций)
1. [console.cloud.google.com](https://console.cloud.google.com) → New Project
2. APIs & Services → Enable APIs → **YouTube Data API v3**
3. Credentials → Create Credentials → API Key
4. В AEGIS → Настройки → вставь YouTube ключ

---

## 📁 Структура проекта

```
aegis/
├── index.html              # Главная страница / весь UI
├── style.css               # HUD дизайн-система
├── app.js                  # Точка входа, навигация, Settings
└── modules/
    ├── chat.js             # ИИ-чат (Claude API)
    ├── voice.js            # Голосовой ввод (Web Speech API)
    ├── tasks.js            # Задачи, цели, файлы
    ├── quiz.js             # Генератор квизов
    ├── youtube.js          # Мониторинг YouTube каналов
    └── analytics.js        # Трекер времени, прогресс, рекомендации
```

---

## ✨ Функции

| Модуль | Описание |
|--------|----------|
| 💬 Чат | ИИ-ассистент на Claude, голосовой ввод, быстрые команды |
| 📋 Задачи | Цели, задачи по предметам, загрузка файлов |
| 🧠 Квизы | Генерация по теме (MCQ / Правда-ложь / Открытые) |
| 📺 YouTube | Отслеживание каналов, AI-саммари видео |
| 📊 Аналитика | Таймер по предметам, прогресс квизов, AI-рекомендации |
| ⚙️ Настройки | API ключи, язык голоса, имя пользователя |

---

## 🛠️ Как добавлять новые функции

Каждый модуль — независимый IIFE в `modules/`. Чтобы добавить новый:

```javascript
// modules/myfeature.js
const MyFeature = (() => {
  function init() { /* ... */ }
  return { init };
})();
```

Потом подключи в `index.html`:
```html
<script src="modules/myfeature.js"></script>
```
И вызови в `app.js`:
```javascript
MyFeature.init();
```

---

## 📌 Roadmap (идеи для следующих версий)

- [ ] Spaced repetition (интервальные повторения)
- [ ] Экспорт заметок в Markdown/PDF  
- [ ] Тёмный/светлый режим
- [ ] Синхронизация через GitHub Gist (без бэкенда)
- [ ] Поддержка PDF — отправка напрямую в Claude
- [ ] Pomodoro-таймер

---

*AEGIS — твой личный щит в учёбе.* 🛡️
