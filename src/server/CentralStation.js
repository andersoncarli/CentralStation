const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const http = require('http');
const fs = require('fs').promises;
const path = require('path');
const debug = require('debug')('cs:server');
const postcss = require('postcss');
const tailwindcss = require('tailwindcss');

class CentralStation {
  constructor(options = {}) {
    this.options = { port: 3000, jwtSecret: 'your-secret-key', usersFile: './data/users.json', modulesDir: 'modules', ...options };
    this.clients = new Map();
    this.modules = new Map();
    this.middleware = [];
    this.wss = null;
    debug('CentralStation instance created with options:', this.options);
  }

  async start() {
    debug('Starting CentralStation');
    await this.ensureUsersFile();
    await this.loadAllModules();
    await this.compileTailwindCSS();
    await this.loadMiddleware();
    this.server = http.createServer(this.handleHttpRequest.bind(this));
    this.wss = new WebSocket.Server({ server: this.server });
    this.wss.on('connection', this.handleWebSocketConnection.bind(this));
    await this.server.listen(this.options.port);
    debug(`CentralStation running on http://localhost:${this.options.port}`);
  }

  async ensureUsersFile() {
    debug('Ensuring users file exists');
    try {
      await fs.access(this.options.usersFile);
      debug('Users file found');
    } catch (error) {
      if (error.code === 'ENOENT') {
        debug('Users file not found, creating new one');
        await fs.writeFile(this.options.usersFile, JSON.stringify([], null, 2));
        debug('Users file created');
      } else {
        throw error;
      }
    }
  }

  async loadAllModules() {
    debug('Loading all modules');
    const files = await fs.readdir(path.join(__dirname, this.options.modulesDir));
    for (const file of files.filter(f => f.endsWith('.js'))) {
      const moduleName = path.basename(file, '.js');
      debug(`Loading module: ${moduleName}`);
      const content = await fs.readFile(path.join(__dirname, this.options.modulesDir, file), 'utf8');
      this.modules.set(moduleName, { content, hash: crypto.createHash('md5').update(content).digest('hex') });
    }
    debug('All modules loaded');
  }

  async compileTailwindCSS() {
    debug('Compiling Tailwind CSS');
    const css = '@tailwind base; @tailwind components; @tailwind utilities;';
    const result = await postcss([tailwindcss]).process(css, { from: undefined });
    await fs.writeFile(path.join(__dirname, '../../public/styles.css'), result.css);
    debug('Tailwind CSS compiled');
  }

  async loadMiddleware() {
    debug('Loading middleware');
    const middlewareDir = path.join(__dirname, 'middleware');
    const files = await fs.readdir(middlewareDir);
    for (const file of files.filter(f => f.endsWith('.js'))) {
      const middleware = require(path.join(middlewareDir, file));
      this.use(middleware);
      debug(`Loaded middleware: ${file}`);
    }
  }

  use(middleware) {
    this.middleware.push(middleware);
  }

  async applyMiddleware(content, context) {
    for (const middleware of this.middleware) {
      const handler = await middleware(context);
      content = await handler(content);
    }
    return content;
  }

  async handleHttpRequest(req, res) {
    debug(`HTTP request received: ${req.url}`);
    let filePath;
    if (req.url === '/' || req.url === '/signup' || req.url === '/login') {
      filePath = path.join(__dirname, '../client/index.html');
    } else {
      filePath = path.join(__dirname, '../client', req.url);
    }
    try {
      const data = await fs.readFile(filePath, 'utf8');
      const contentType = filePath.endsWith('.js') ? 'application/javascript' : 'text/html';
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
      debug(`Served file: ${filePath}`);
    } catch (error) {
      debug(`File not found: ${filePath}`);
      res.writeHead(404).end('Not Found');
    }
  }

  handleWebSocketConnection(ws) {
    const clientId = crypto.randomUUID();
    debug(`New WebSocket connection: ${clientId}`);
    const hub = this.createClientHub(ws, clientId);
    this.clients.set(clientId, hub);

    hub.on('getBlogPosts', async () => {
      const posts = await this.getBlogPosts();
      hub.emit('blogPosts', posts);
    });

    hub.emit('init', { clientId });
    debug(`Sent init event to client: ${clientId}`);
  }

  async getBlogPosts() {
    // Simulate fetching blog posts from a database
    return [
      { title: 'First Post', content: 'This is the content of the first post.' },
      { title: 'Second Post', content: 'This is the content of the second post.' }
    ];
  }

  createClientHub(ws, clientId) {
    return {
      clientId,
      emit: (event, data) => {
        debug(`Emitting event to client ${clientId}: ${event}`);
        ws.send(JSON.stringify({ event, data }));
      },
      on: (event, callback) => {
        ws.on('message', (message) => {
          try {
            const { event: msgEvent, data } = JSON.parse(message);
            if (msgEvent === event) {
              debug(`Received event from client ${clientId}: ${msgEvent}`);
              callback(data);
            }
          } catch (error) {
            debug(`Failed to process message from client ${clientId}:`, error);
          }
        });
      }
    };
  }
}

module.exports = CentralStation;