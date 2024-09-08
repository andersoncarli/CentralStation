const fs = require('fs').promises;
const path = require('path');
const cheerio = require('cheerio');

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
  context.use((content) => translate(content, lang));
}

module.exports = { i18nMiddleware, loadTranslations, translate, getLanguage };