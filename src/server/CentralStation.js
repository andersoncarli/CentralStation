const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const http = require('http');
const fs = require('fs').promises;
const path = require('path');

class CentralStation {
  constructor(options = {}) {
    this.options = { port: 3000, jwtSecret: 'your-secret-key', usersFile: 'users.json', modulesDir: 'modules', ...options };
    this.clients = new Map();
    this.modules = new Map();
    this.wss = null;
  }

  async start() {
    await this.ensureUsersFile();
    await this.loadAllModules();
    this.server = http.createServer(this.handleHttpRequest.bind(this));
    this.wss = new WebSocket.Server({ server: this.server });
    this.wss.on('connection', this.handleWebSocketConnection.bind(this));
    await this.server.listen(this.options.port);
    console.log(`CentralStation running on http://localhost:${this.options.port}`);
  }

  async ensureUsersFile() {
    try {
      await fs.access(this.options.usersFile);
    } catch (error) {
      if (error.code === 'ENOENT') {
        await fs.writeFile(this.options.usersFile, JSON.stringify([], null, 2));
      } else {
        throw error;
      }
    }
  }

  async loadAllModules() {
    const files = await fs.readdir(path.join(__dirname, this.options.modulesDir));
    for (const file of files.filter(f => f.endsWith('.js'))) {
      const moduleName = path.basename(file, '.js');
      const content = await fs.readFile(path.join(__dirname, this.options.modulesDir, file), 'utf8');
      this.modules.set(moduleName, { content, hash: crypto.createHash('md5').update(content).digest('hex') });
    }
  }

  async handleHttpRequest(req, res) {
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
    } catch (error) {
      res.writeHead(404).end('Not Found');
    }
  }

  handleWebSocketConnection(ws) {
    const clientId = crypto.randomUUID();
    const hub = this.createClientHub(ws, clientId);
    this.clients.set(clientId, hub);

    hub.on('auth', async ({ username, password }) => {
      const users = JSON.parse(await fs.readFile(this.options.usersFile, 'utf8'));
      const user = users.find(u => u.username === username && u.passwordHash === this.hashPassword(password));
      if (user) {
        hub.username = username;
        hub.emit('authStateChange', true);
        hub.emit('authSuccess', { username, token: jwt.sign({ username }, this.options.jwtSecret, { expiresIn: '1h' }) });
      } else {
        hub.emit('authError', { message: 'Invalid credentials' });
      }
    });

    hub.on('signup', async ({ username, password }) => {
      const users = JSON.parse(await fs.readFile(this.options.usersFile, 'utf8'));
      if (users.some(u => u.username === username)) {
        hub.emit('signupError', { message: 'Username already exists' });
      } else {
        users.push({ username, passwordHash: this.hashPassword(password) });
        await fs.writeFile(this.options.usersFile, JSON.stringify(users, null, 2));
        hub.emit('signupSuccess');
      }
    });

    hub.on('logout', () => {
      hub.username = null;
      hub.emit('authStateChange', false);
    });

    hub.on('require', ({ moduleName, hash }) => {
      const module = this.modules.get(moduleName);
      if (!module) {
        hub.emit('error', { message: `Module not found: ${moduleName}` });
      } else if (module.hash !== hash) {
        hub.emit('module', { name: moduleName, content: module.content, hash: module.hash });
      } else {
        hub.emit('module', { name: moduleName, upToDate: true });
      }
    });

    hub.on('mouseMove', (position) => {
      console.log(`Mouse moved for ${hub.username}: ${JSON.stringify(position)}`);
    });

    hub.emit('init', { clientId });
  }

  createClientHub(ws, clientId) {
    return {
      clientId,
      emit: (event, data) => ws.send(JSON.stringify({ event, data })),
      on: (event, callback) => ws.on('message', (message) => {
        try {
          const { event: msgEvent, data } = JSON.parse(message);
          if (msgEvent === event) callback(data);
        } catch (error) {
          console.error('Failed to process message:', error);
        }
      })
    };
  }

  hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
  }
}

module.exports = CentralStation;