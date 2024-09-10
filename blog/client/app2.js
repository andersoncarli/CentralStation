import '../../src/client/utils.js';

const cs = new CentralStation();

let currentTheme = window.__THEME__ || 'light';
let currentLang = window.__LANG__ || 'en';

function updateTheme(theme) {
  document.body.className = theme;
  currentTheme = theme;
  cs.emit('theme:change', { theme });
}

function updateLang(lang) {
  currentLang = lang;
  cs.emit('lang:change', { lang });
  renderApp();
}

function t(key) {
  return window.__TRANSLATIONS__[key] || key;
}

function renderApp() {
  const root = document.getElementById('root');
  root.innerHTML = soml.toHtml(App({
    children: renderCurrentRoute(),
    theme: currentTheme,
    lang: currentLang
  }));
}

function renderCurrentRoute() {
  const path = window.location.pathname;
  // Implement routing logic here
  // Return the appropriate component based on the current path
}

cs.on('post:update', (posts) => {
  renderApp();
});

cs.on('task:update', (tasks) => {
  renderApp();
});

// Theme toggle
const themeToggle = document.getElementById('theme-toggle');
if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    updateTheme(currentTheme === 'light' ? 'dark' : 'light');
  });
}

// Language selector
const langSelect = document.getElementById('lang-select');
if (langSelect) {
  langSelect.addEventListener('change', (e) => {
    updateLang(e.target.value);
  });
}

// Initial render
renderApp();