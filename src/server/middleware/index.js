const fs = require('fs').promises;
const path = require('path');
const cheerio = require('cheerio');
const postcss = require('postcss');
const tailwindcss = require('tailwindcss');
const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');
const jwt = require('jsonwebtoken');

// i18n middleware
let translations = {};

async function loadTranslations() {
  const files = await fs.readdir(path.join(process.cwd(), 'locales'));
  for (const file of files) {
    const lang = path.basename(file, '.json');
    const content = await fs.readFile(path.join(process.cwd(), 'locales', file), 'utf-8');
    translations[lang] = JSON.parse(content);
  }
}

function translate(content, lang) {
  const $ = cheerio.load(content);
  $('*').contents().filter(function() {
    return this.nodeType === 3; // Text nodes
  }).each(function() {
    const text = $(this).text().trim();
    if (text) {
      $(this).replaceWith(translations[lang][text] || text);
    }
  });
  return $.html();
}

function getLanguage(req) {
  return req.headers['accept-language']?.split(',')[0] || 'en';
}

async function i18nMiddleware(context) {
  const { req } = context;
  const lang = getLanguage(req);
  context.lang = lang;
  context.t = (key) => translations[lang][key] || key;

  // Ensure translations are loaded
  await loadTranslations();

  // Apply translations to all text content
  return (content) => translate(content, lang);
}

// Theme middleware
const themes = {
  light: {
    'bg-primary': '#ffffff',
    'text-primary': '#000000',
  },
  dark: {
    'bg-primary': '#1a202c',
    'text-primary': '#ffffff',
  }
};

function applyTheme(content, theme) {
  let themedContent = content;
  Object.entries(themes[theme]).forEach(([key, value]) => {
    themedContent = themedContent.replace(new RegExp(`var\\(--${key}\\)`, 'g'), value);
  });
  return themedContent;
}

function themeMiddleware(context) {
  const { req } = context;
  const theme = req.headers['theme'] || 'light';
  context.theme = theme;
  return (content) => applyTheme(content, theme);
}

// CSS middleware
async function processCss(css, classes) {
  const result = await postcss([
    tailwindcss({
      content: [{ raw: classes.join(' '), extension: 'html' }],
      safelist: classes,
    }),
    autoprefixer,
    cssnano
  ]).process(css, { from: undefined });

  return result.css;
}

async function cssMiddleware(context) {
  context.processCss = processCss;
  return async (content) => {
    // Process any inline styles or CSS imports here
    return content;
  };
}

// Auth middleware
function authMiddleware(context) {
  const { req } = context;
  const token = req.headers['authorization'];
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      context.user = decoded;
    } catch (ex) {
      // Invalid token
    }
  }
  return (content) => content; // Auth doesn't modify content directly
}

module.exports = {
  i18nMiddleware,
  themeMiddleware,
  cssMiddleware,
  authMiddleware
};