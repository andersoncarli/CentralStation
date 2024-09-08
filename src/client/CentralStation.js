// client/CentralStation.js
class CentralStation {
  constructor(options = {}) {
    this.options = { url: 'ws://localhost:3000', ...options };
    this.ws = new WebSocket(this.options.url);
    this.clientId = null;
    this.eventHandlers = {};
    this.moduleCache = new Map();
    this.moduleCallbacks = new Map();
    this.token = localStorage.getItem('authToken');
    this.currentRoute = '/';
    this.routes = {};

    this.ws.onmessage = (event) => {
      try {
        const { event: eventName, data } = JSON.parse(event.data);
        if (this.eventHandlers[eventName]) {
          this.eventHandlers[eventName](data);
        }
      } catch (error) {
        console.error('Failed to parse message:', error);
      }
    };

    this.on('init', (data) => {
      this.clientId = data.clientId;
      this.onReady();
    });

    this.on('module', this.handleModuleResponse.bind(this));
    this.on('error', this.handleError.bind(this));
    this.on('authSuccess', (data) => {
      localStorage.setItem('authToken', data.token);
      this.token = data.token;
      this.navigate('/dashboard');
    });
    this.on('state', this.handleStateUpdate.bind(this));

    window.addEventListener('popstate', this.handlePopState.bind(this));
  }

  onReady() {
    if (this.token) {
      this.emit('auth', { token: this.token });
    } else {
      this.navigate('/login');
    }
  }

  emit(event, data) {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ event, data }));
    } else {
      console.warn('WebSocket is not open. Message not sent.');
    }
  }

  on(event, callback) {
    this.eventHandlers[event] = callback;
  }

  async require(moduleName) {
    return new Promise((resolve, reject) => {
      const cachedModule = this.moduleCache.get(moduleName);
      if (cachedModule) {
        resolve(cachedModule);
        return;
      }

      if (!this.moduleCallbacks.has(moduleName)) {
        this.moduleCallbacks.set(moduleName, []);
      }
      this.moduleCallbacks.get(moduleName).push({ resolve, reject });

      const hash = cachedModule ? cachedModule.hash : null;
      this.emit('require', { moduleName, hash });
    });
  }

  async handleModuleResponse(data) {
    const { name, content, hash, dependencies, upToDate } = data;
    if (!upToDate) {
      const moduleExports = {};
      const moduleFunction = new Function('exports', 'require', content);
      const moduleRequire = async (dep) => await this.require(dep);
      await moduleFunction(moduleExports, moduleRequire);
      this.moduleCache.set(name, { exports: moduleExports, hash });

      if (dependencies) {
        for (const dep of dependencies) {
          await this.require(dep);
        }
      }
    }

    const callbacks = this.moduleCallbacks.get(name) || [];
    callbacks.forEach(({ resolve }) => resolve(this.moduleCache.get(name).exports));
    this.moduleCallbacks.delete(name);
  }

  handleError(data) {
    console.error('Hub Error:', data.message);
    alert(`An error occurred: ${data.message}`);
  }

  handleStateUpdate(data) {
    console.log('State updated:', data);
    // Update UI based on new state
  }

  login(username, password) {
    this.emit('auth', { username, password });
  }

  signup(username, password) {
    this.emit('signup', { username, password });
  }

  logout() {
    localStorage.removeItem('authToken');
    this.token = null;
    this.navigate('/login');
  }

  route(path, callback) {
    this.routes[path] = callback;
  }

  navigate(path) {
    history.pushState(null, '', path);
    this.handleRoute(path);
  }

  handlePopState() {
    this.handleRoute(window.location.pathname);
  }

  handleRoute(path) {
    this.currentRoute = path;
    const route = this.routes[path] || this.routes['*'];
    if (route) {
      route();
    } else {
      console.error('Route not found:', path);
    }
  }
}

const cs = new CentralStation();

// Define routes
cs.route('/login', () => {
  document.body.innerHTML = `
    <h1>Login</h1>
    <form id="loginForm">
      <input type="text" id="username" placeholder="Username" required>
      <input type="password" id="password" placeholder="Password" required>
      <button type="submit">Login</button>
    </form>
    <a href="/signup">Sign Up</a>
  `;
  document.getElementById('loginForm').onsubmit = (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    cs.login(username, password);
  };
});

cs.route('/signup', () => {
  document.body.innerHTML = `
    <h1>Sign Up</h1>
    <form id="signupForm">
      <input type="text" id="username" placeholder="Username" required>
      <input type="password" id="password" placeholder="Password" required>
      <button type="submit">Sign Up</button>
    </form>
    <a href="/login">Login</a>
  `;
  document.getElementById('signupForm').onsubmit = (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    cs.signup(username, password);
  };
});

cs.route('/dashboard', async () => {
  if (!cs.token) return cs.navigate('/login');

  document.body.innerHTML = `
    <h1>Dashboard</h1>
    <p>Welcome, <span id="username"></span>!</p>
    <div id="time"></div>
    <button id="logoutBtn">Logout</button>
  `;

  document.getElementById('logoutBtn').onclick = () => cs.logout();

  try {
    const timeFormatter = await cs.require('timeFormatter');
    cs.on('time', (time) => {
      const formattedTime = timeFormatter.format(time);
      document.getElementById('time').textContent = formattedTime;
    });
  } catch (error) {
    console.error('Failed to load timeFormatter module:', error);
  }
});

cs.route('*', () => {
  document.body.innerHTML = `
    <h1>404 Not Found</h1>
    <p>The page you're looking for doesn't exist.</p>
    <a href="/">Go Home</a>
  `;
});

window.cs = cs;