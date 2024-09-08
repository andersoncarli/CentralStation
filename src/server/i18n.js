import fs from 'fs/promises';
import path from 'path';

let translations = {};

export async function loadTranslations() {
  const files = await fs.readdir(path.join(process.cwd(), 'locales'));
  for (const file of files) {
    const lang = path.basename(file, '.json');
    const content = await fs.readFile(path.join(process.cwd(), 'locales', file), 'utf-8');
    translations[lang] = JSON.parse(content);
  }
}

export function translate(content, lang) {
  return content.replace(/\{\{(.*?)\}\}/g, (match, key) => {
    return translations[lang][key] || key;
  });
}

export function getLanguage(req) {
  return req.headers['accept-language']?.split(',')[0] || 'en';
}