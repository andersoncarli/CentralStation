import { applyTheme } from './theme.js';

export function themeMiddleware(context) {
  const { req } = context;
  const theme = req.headers['theme'] || 'light';
  context.theme = theme;
  context.applyTheme = (content) => applyTheme(content, theme);
}