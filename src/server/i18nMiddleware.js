import { translate, getLanguage, loadTranslations } from './i18n.js';

export async function i18nMiddleware(context) {
  const { req } = context;
  const lang = getLanguage(req);
  context.lang = lang;
  context.t = (key) => translate(key, lang);

  // Ensure translations are loaded
  await loadTranslations();
}