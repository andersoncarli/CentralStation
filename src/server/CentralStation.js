const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const http = require('http');
const fs = require('fs').promises;
const path = require('path');
const debug = require('debug')('cs:server');
const nodeFlags = require('node-flags');
const DB = require('./db/DB');
const { connectToDatabase } = require('./database');
const logger = require('./logger');

class CentralStation {
  constructor(options = {}) {
    this.options = {
      port: 3000,
      jwtSecret: 'your-secret-key',
      dbOptions: { type: 'json', url: './data' },
      modulesDir: 'modules',
      ...options
    };
    this.clients = new Map();
    this.modules = new Map();
    this.routes = new Map();
    this.eventHandlers = new Map();
    this.middleware = [];
    this.wss = null;
    this.userStates = new Map();
    this.db = new DB(options.dbOptions);
    debug('CentralStation instance created with options:', this.options);
  }

  async start() {
    debug('Starting CentralStation');
    await connectToDatabase();
    // await this.ensureUsersFile();
    await this.loadAllModules();
    this.server = http.createServer(this.handleHttpRequest.bind(this));
    this.wss = new WebSocket.Server({ server: this.server });
    this.wss.on('connection', this.handleWebSocketConnection.bind(this));

    await this.db.connect();

    // Add basic middleware
    this.use(require('./middleware/auth'));
    this.use(require('./middleware/i18n'));
    this.use(require('./middleware/theme'));
    this.use(require('./middleware/css'));

    await this.server.listen(this.options.port);
    debug(`CentralStation running on http://localhost:${this.options.port}`);
  }

  use(middleware) {
    this.middleware.push(middleware);
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

  async applyMiddleware(content, context) {
    for (const middleware of this.middleware) {
      const handler = await middleware(context);
      content = await handler(content);
    }
    return content;
  }

  handleError(error, req, res) {
    logger.error('An error occurred', { error: error.message, stack: error.stack });
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal Server Error');
  }

  async handleHttpRequest(req, res) {
    try {
      debug(`HTTP request received: ${req.url}`);
      const route = this.routes.get(req.url);
      if (route) {
        const context = { req, res };
        let content = await route(req, res, context);
        content = await this.applyMiddleware(content, context);
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(content);
      } else {
        // ... (keep existing static file serving logic)
      }
    } catch (error) {
      this.handleError(error, req, res);
    }
  }

  handleWebSocketConnection(ws) {
    const clientId = crypto.randomUUID();
    debug(`New WebSocket connection: ${clientId}`);
    const hub = this.createClientHub(ws, clientId);
    this.clients.set(clientId, hub);

    hub.on('auth', async ({ username, password }) => {
      debug(`Auth attempt for user: ${username}`);
      const users = JSON.parse(await fs.readFile(this.options.usersFile, 'utf8'));
      const user = users.find(u => u.username === username && u.passwordHash === this.hashPassword(password));
      if (user) {
        hub.username = username;
        hub.emit('authStateChange', true);
        hub.emit('authSuccess', { username, token: jwt.sign({ username }, this.options.jwtSecret, { expiresIn: '1h' }) });
        debug(`Auth successful for user: ${username}`);
      } else {
        hub.emit('authError', { message: 'Invalid credentials' });
        debug(`Auth failed for user: ${username}`);
      }
    });

    hub.on('signup', async ({ username, password }) => {
      debug(`Signup attempt for user: ${username}`);
      const users = JSON.parse(await fs.readFile(this.options.usersFile, 'utf8'));
      if (users.some(u => u.username === username)) {
        hub.emit('signupError', { message: 'Username already exists' });
        debug(`Signup failed: Username ${username} already exists`);
      } else {
        users.push({ username, passwordHash: this.hashPassword(password) });
        await fs.writeFile(this.options.usersFile, JSON.stringify(users, null, 2));
        hub.emit('signupSuccess');
        debug(`Signup successful for user: ${username}`);
      }
    });

    hub.on('logout', () => {
      debug(`Logout for user: ${hub.username}`);
      hub.username = null;
      hub.emit('authStateChange', false);
    });

    hub.on('require', ({ moduleName, hash }) => {
      debug(`Module required: ${moduleName}`);
      const module = this.modules.get(moduleName);
      if (!module) {
        hub.emit('error', { message: `Module not found: ${moduleName}` });
        debug(`Module not found: ${moduleName}`);
      } else if (module.hash !== hash) {
        hub.emit('module', { name: moduleName, content: module.content, hash: module.hash });
        debug(`Module ${moduleName} sent to client`);
      } else {
        hub.emit('module', { name: moduleName, upToDate: true });
        debug(`Module ${moduleName} is up to date`);
      }
    });

    hub.on('mouseMove', (position) => {
      debug(`Mouse moved for ${hub.username}: ${JSON.stringify(position)}`);
    });

    hub.emit('init', { clientId });
    debug(`Sent init event to client: ${clientId}`);
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

  hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
  }
}

module.exports = CentralStation;