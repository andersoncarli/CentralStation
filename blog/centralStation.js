import postcss from 'postcss';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';
import fs from 'fs/promises';
import { renderToString } from 'react-dom/server';
import { hydrate } from 'react-dom';
import React from 'react';

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
  } else if (path === '/api/blogpost') {
    const post = await fetchBlogPost(); // Implement this function
    client.emit('blogpost', post);
  } else {
    // Handle other file types...
  }
});

function soml(...args) {
  const extract = (arr, type) => arr.find(arg => typeof arg === type);
  const tag = extract(args, 'string') || 'div';
  const props = extract(args, 'object') || {};
  const children = extract(args, 'function') || (() => extract(args, 'array') || []);

  const element = { $: tag, _: props, '': children };

  return new Proxy(element, {
    get(target, prop) {
      if (prop === 'toArray') {
        return () => [tag, props, children];
      }
      if (prop === 'toObject') {
        return () => ({ [tag]: { ...props, children: children() } });
      }
      return target[prop];
    }
  });
}

soml.plugins = {};

soml.plugin = (name, to, from, opts = {}) => {
  soml.plugins[name] = { to, from, opts };
  soml[`to${name.charAt(0).toUpperCase() + name.slice(1)}`] = (element) => to(element, opts);
  soml[`from${name.charAt(0).toUpperCase() + name.slice(1)}`] = (data) => from(data, opts);
};

// Example usage
const Button = soml('Button', { onClick: () => alert('Clicked!') }, () => ['Click me']);

const App = soml('App', () => ({
  div: {
    h1: 'Hello, World!',
    Button: { text: 'Click me', onClick: () => alert('Clicked!') }
  }
}));

// HTML Plugin
soml.plugin('html',
  (element, opts = {}) => {
    const { $: tag, _: props, '': children } = element;
    const attrs = Object.entries(props)
      .map(([key, value]) => `${key}="${value}"`)
      .join(' ');
    const childrenHtml = (typeof children === 'function' ? children() : children)
      .map(child => soml.toHtml(child))
      .join('');
    return `<${tag} ${attrs}>${childrenHtml}</${tag}>`;
  },
  (htmlString, opts = {}) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');
    const domToSoml = (node) => {
      if (node.nodeType === Node.TEXT_NODE) return node.textContent;
      const tag = node.tagName.toLowerCase();
      const props = {};
      Array.from(node.attributes).forEach(attr => {
        props[attr.name] = attr.value;
      });
      const children = Array.from(node.childNodes).map(domToSoml);
      return soml(tag, props, children);
    };
    return domToSoml(doc.body.firstChild);
  }
);

// DOM Plugin
soml.plugin('dom',
  (element, opts = { document: window.document }) => {
    const { $: tag, _: props, '': children } = element;
    const el = opts.document.createElement(tag);
    Object.entries(props).forEach(([key, value]) => {
      if (key.startsWith('on') && typeof value === 'function') {
        el.addEventListener(key.slice(2).toLowerCase(), value);
      } else {
        el.setAttribute(key, value);
      }
    });
    (typeof children === 'function' ? children() : children).forEach(child => {
      el.appendChild(typeof child === 'string' ? opts.document.createTextNode(child) : soml.toDom(child, opts));
    });
    return el;
  },
  (domElement, opts = {}) => {
    if (domElement.nodeType === Node.TEXT_NODE) return domElement.textContent;
    const tag = domElement.tagName.toLowerCase();
    const props = {};
    Array.from(domElement.attributes).forEach(attr => {
      props[attr.name] = attr.value;
    });
    const children = Array.from(domElement.childNodes).map(node => soml.fromDom(node, opts));
    return soml(tag, props, children);
  }
);

// JSON Plugin
soml.plugin('json',
  (element, opts = {}) => JSON.stringify(element.toObject()),
  (jsonString, opts = {}) => {
    const obj = JSON.parse(jsonString);
    const [tag, props, children] = Object.entries(obj)[0];
    return soml(tag, props, children);
  }
);

// Update extractClassesFromComponents function
function extractClassesFromComponents() {
  const extractClasses = (element) => {
    if (typeof element !== 'object') return [];
    const { _: props = {}, '': children = [] } = element;
    const classNames = props.class ? props.class.split(' ') : [];
    return [
      ...classNames,
      ...(typeof children === 'function' ? children() : children).flatMap(extractClasses)
    ];
  };

  return Object.values(soml.components || {}).flatMap(extractClasses);
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