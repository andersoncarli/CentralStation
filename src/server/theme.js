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

export function applyTheme(content, theme) {
  let themedContent = content;
  Object.entries(themes[theme]).forEach(([key, value]) => {
    themedContent = themedContent.replace(new RegExp(`var\\(--${key}\\)`, 'g'), value);
  });
  return themedContent;
}