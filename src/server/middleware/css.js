const postcss = require('postcss');
const tailwindcss = require('tailwindcss');
const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');
const fs = require('fs').promises;

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
}

module.exports = { cssMiddleware, processCss };