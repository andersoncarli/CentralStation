soml('./index.html', ({ component, theme, lang }) => ({
  html: {
    lang: 'en',
    head: {
      meta: { charset: 'UTF-8', name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
      title: component.title || 'My App',
      style: this.generateThemeCSS(this.themes[theme])
    },
    body: {
      class: theme,
      'div#root': component.content,
      script: { src: '/centralStation.js' },
      script: () => (window.__cs = {
        initialState: JSON.stringify(this.state),
        theme, lang, translations: JSON.stringify(this.translations[lang])
      })
    }
  }
}));
