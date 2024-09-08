// server.js
const http = require('http');
const WebSocket = require('ws');
const fs = require('fs').promises;
const crypto = require('crypto');
const path = require('path');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'your-secret-key'; // In production, use a secure, environment-specific secret
const USERS_FILE = path.join(__dirname, 'users.json');

const clients = new Map();
const modules = new Map();

async function loadModule(moduleName) {
  const modulePath = path.join(__dirname, 'modules', `${moduleName}.js`);
  const content = await fs.readFile(modulePath, 'utf8');
  const hash = crypto.createHash('md5').update(content).digest('hex');

  const dependencyRegex = /hub\.require\(['"](.+?)['"]\)/g;
  const dependencies = [];
  let match;
  while ((match = dependencyRegex.exec(content)) !== null) {
    dependencies.push(match[1]);
  }

  modules.set(moduleName, { content, hash, dependencies });
  return { content, hash, dependencies };
}

async function loadAllModules() {
  const modulesDir = path.join(__dirname, 'modules');
  const files = await fs.readdir(modulesDir);
  for (const file of files) {
    if (file.endsWith('.js')) {
      const moduleName = path.basename(file, '.js');
      await loadModule(moduleName);
    }
  }
}

const server = http.createServer(async (req, res) => {
  if (req.url === '/central-station.js') {
    try {
      const data = await fs.readFile('hub.js', 'utf8');
      res.writeHead(200, { 'Content-Type': 'application/javascript' });
      res.end(data);
    } catch (err) {
      res.writeHead(500);
      res.end('Error loading Hub.js');
    }
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  const clientId = crypto.randomUUID();
  const hub = createClientHub(ws, clientId);
  clients.set(clientId, hub);

  hub.on('require', async ({ moduleName, hash }) => {
    let module = modules.get(moduleName);
    if (!module) {
      try {
        module = await loadModule(moduleName);
      } catch (error) {
        hub.emit('error', { message: `Module not found: ${moduleName}` });
        return;
      }
    }
    if (module.hash !== hash) {
      hub.emit('module', {
        name: moduleName,
        content: module.content,
        hash: module.hash,
        dependencies: module.dependencies
      });
    } else {
      hub.emit('module', { name: moduleName, upToDate: true });
    }
  });

  hub.on('auth', async ({ username, password }) => {
    try {
      const users = JSON.parse(await fs.readFile(USERS_FILE, 'utf8'));
      const user = users.find(u => u.username === username && u.passwordHash === hashPassword(password));
      if (user) {
        const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '1h' });
        hub.username = username;
        hub.emit('authSuccess', { token });
        hub.emit('state', { username, /* other user state */ });
      } else {
        hub.emit('authError', { message: 'Invalid credentials' });
      }
    } catch (error) {
      hub.emit('error', { message: 'Authentication error' });
    }
  });

  hub.on('signup', async ({ username, password }) => {
    try {
      const users = JSON.parse(await fs.readFile(USERS_FILE, 'utf8'));
      if (users.some(u => u.username === username)) {
        hub.emit('signupError', { message: 'Username already exists' });
      } else {
        users.push({ username, passwordHash: hashPassword(password) });
        await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
        hub.emit('signupSuccess');
      }
    } catch (error) {
      hub.emit('error', { message: 'Signup error' });
    }
  });

  hub.on('error', (data) => {
    console.error(`Client Error (${clientId}):`, data);
  });

  hub.emit('init', { clientId });
});

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function createClientHub(ws, clientId) {
  const hub = {
    clientId,
    emit: (event, data) => {
      ws.send(JSON.stringify({ event, data }));
    },
    on: (event, callback) => {
      ws.on('message', (message) => {
        try {
          const { event: msgEvent, data } = JSON.parse(message);
          if (msgEvent === event) {
            callback(data);
          }
        } catch (error) {
          console.error('Failed to process message:', error);
        }
      });
    }
  };
  return hub;
}

loadAllModules().then(() => {
  server.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
  });
});
