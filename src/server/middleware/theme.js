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

module.exports = async (context) => {
  return async (content) => {
    const { req } = context;
    const theme = req.headers['theme'] || 'light';
    context.theme = theme;
    context.applyTheme = (content) => applyTheme(content, theme);
    return content;
  };
};