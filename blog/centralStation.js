import postcss from 'postcss';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';
import fs from 'fs/promises';

// Add this function to process CSS
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

// Modify the 'require' event handler
cs.on('require', async (client, { path }) => {
  if (path.endsWith('.css')) {
    const rawCss = await fs.readFile(path, 'utf8');
    const usedClasses = extractClassesFromComponents(); // You'll need to implement this function
    const processedCss = await processCss(rawCss, usedClasses);
    client.emit('css', processedCss);
  } else if (path.startsWith('/flags/')) {
    const flagPath = `./node_modules/node-flags/flags${path}`;
    const flag = await fs.readFile(flagPath);
    client.emit('flag', { path, data: flag.toString('base64') });
  } else {
    // Handle other file types...
  }
});

export function component(name, renderFunc) {
  // Add a method to extract classes from the component
  customElements.define(name, class extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
      this.render();
    }

    attributeChangedCallback() {
      this.render();
    }

    render() {
      this.shadowRoot.innerHTML = renderFunc.call(this);
    }

    static get observedAttributes() {
      return ['posts', 'post'];
    }

    static extractClasses() {
      const tempElement = document.createElement('div');
      tempElement.innerHTML = renderFunc.call(tempElement);
      return Array.from(tempElement.querySelectorAll('*'))
        .flatMap(el => el.className.split(' '))
        .filter(Boolean);
    }
  });

  return renderFunc;
}

// Function to extract classes from all components
function extractClassesFromComponents() {
  return Object.values(customElements.get)
    .filter(el => el.extractClasses)
    .flatMap(el => el.extractClasses());
}

// Add theme and i18n handling
const themes = {
  light: {
    'bg-primary': '#ffffff',
    'text-primary': '#000000',
    // Add more theme variables
  },
  dark: {
    'bg-primary': '#1a202c',
    'text-primary': '#ffffff',
    // Add more theme variables
  }
};

const translations = {
  en: {},
  es: {
    "Hello World!": "¡Hola Mundo!",
    // Add more translations
  }
};

function setTheme(themeName) {
  const root = document.documentElement;
  Object.entries(themes[themeName]).forEach(([key, value]) => {
    root.style.setProperty(`--${key}`, value);
  });
  localStorage.setItem('theme', themeName);
}

function t(key, lang = 'en') {
  return translations[lang][key] || key;
}