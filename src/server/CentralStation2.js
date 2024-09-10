const WebSocket = require('ws');
const http = require('http');
const soml = require('./soml');
const DB = require('./db/DB');

class CentralStation {
  constructor(options = {}) {
    this.options = {
      port: 3000,
      dbOptions: { type: 'json', dataDir: './data' },
      ...options
    };
    this.clients = new Map();
    this.routes = new Map();
    this.components = new Map();
    this.eventHandlers = new Map();
    this.db = new DB(this.options.dbOptions);
    this.state = {};
    this.themes = {
      light: { /* light theme styles */ },
      dark: { /* dark theme styles */ }
    };
    this.translations = {
      en: { /* English translations */ },
      es: { /* Spanish translations */ }
    };
  }

  start() {
    this.server = http.createServer(this.handleHttpRequest.bind(this));
    this.wss = new WebSocket.Server({ server: this.server });
    this.wss.on('connection', this.handleWebSocketConnection.bind(this));
    this.server.listen(this.options.port);
    console.log(`CentralStation running on http://localhost:${this.options.port}`);
  }

  route(path, component) {
    this.routes.set(path, component);
  }

  registerComponent(name, component) {
    this.components.set(name, component);
  }

  on(eventPattern, handler) {
    if (!this.eventHandlers.has(eventPattern)) {
      this.eventHandlers.set(eventPattern, []);
    }
    this.eventHandlers.get(eventPattern).push(handler);
  }

  emit(event, data, clientId = null) {
    const [entity, action] = event.split(':');
    const patterns = [
      event,
      `${entity}:*`,
      `*:${action}`,
      '*:*'
    ];

    patterns.forEach(pattern => {
      const handlers = this.eventHandlers.get(pattern) || [];
      handlers.forEach(handler => handler(data, clientId, event));
    });
  }

  async handleHttpRequest(req, res) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const route = this.routes.get(url.pathname);
    if (route) {
      const theme = req.headers['x-preferred-theme'] || 'light';
      const lang = req.headers['accept-language']?.split(',')[0] || 'en';
      const component = typeof route === 'function' ? await route(req, res, { theme, lang }) : route;
      const html = this.renderFullPage(component, { theme, lang });
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
  }

  renderFullPage(component, { theme, lang }) {
    const themeStyles = this.themes[theme];
    const translations = this.translations[lang];
    return `
      <!DOCTYPE html>
      <html lang="${lang}">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${component.title || 'My App'}</title>
          <style>${this.generateThemeCSS(themeStyles)}</style>
        </head>
        <body class="${theme}">
          <div id="root">${soml.toHtml(component)}</div>
          <script>
            window.__INITIAL_STATE__ = ${JSON.stringify(this.state)};
            window.__THEME__ = "${theme}";
            window.__LANG__ = "${lang}";
            window.__TRANSLATIONS__ = ${JSON.stringify(translations)};
          </script>
          <script src="/client.js"></script>
        </body>
      </html>
    `;
  }

  generateThemeCSS(themeStyles) {
    return Object.entries(themeStyles)
      .map(([key, value]) => `--${key}: ${value};`)
      .join('\n');
  }

  handleDataEvent(event, data, clientId) {
    const [entity, action] = event.split(':');

    const actions = {
      fetch: async () => this.db.findMany(entity, data.query || {}, data.options || {}),
      create: async () => this.db.create(entity, data),
      update: async () => this.db.update(entity, { id: data.id }, data),
      delete: async () => {
        await this.db.delete(entity, { id: data.id });
        return { id: data.id };
      }
    };

    if (actions[action]) {
      actions[action]().then(result => {
        this.updateState(entity, result);
        this.broadcastState(entity, clientId);
      });
    }
  }

  updateState(entity, data) {
    if (Array.isArray(data)) {
      this.state[entity] = data;
    } else if (data.id) {
      this.state[entity] = this.state[entity] || [];
      const index = this.state[entity].findIndex(item => item.id === data.id);
      if (index !== -1) {
        this.state[entity][index] = data;
      } else {
        this.state[entity].push(data);
      }
    }
  }

  broadcastState(entity, excludeClientId = null) {
    const message = JSON.stringify({ event: `${entity}:update`, data: this.state[entity] });
    this.clients.forEach((ws, clientId) => {
      if (clientId !== excludeClientId) {
        ws.send(message);
      }
    });
  }

  handleWebSocketConnection(ws) {
    const clientId = Math.random().toString(36).substr(2, 9);
    this.clients.set(clientId, ws);

    ws.on('message', (message) => {
      const { event, data } = JSON.parse(message);
      this.handleDataEvent(event, data, clientId);
    });

    ws.on('close', () => {
      this.clients.delete(clientId);
    });
  }
}

module.exports = CentralStation;