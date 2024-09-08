// client/CentralStation.js
class CentralStation {
  constructor(options = {}) {
    this.options = { url: 'ws://localhost:3000', ...options };
    this.ws = new WebSocket(this.options.url);
    this.eventHandlers = {};
    this.moduleCache = new Map();
    this.moduleCallbacks = new Map();
    this.token = localStorage.getItem('authToken');
    this.messageQueue = [];
    this.isConnected = false;

    this.ws.onopen = () => {
      this.isConnected = true;
      this.messageQueue.forEach(msg => this.ws.send(msg));
      this.messageQueue = [];
    };

    this.ws.onmessage = (event) => {
      const { event: eventName, data } = JSON.parse(event.data);
      if (this.eventHandlers[eventName]) {
        this.eventHandlers[eventName](data);
      }
    };

    this.on('module', this.handleModuleResponse.bind(this));
    this.on('authSuccess', this.handleAuthSuccess.bind(this));
  }

  emit(event, data) {
    const message = JSON.stringify({ event, data });
    if (this.isConnected) {
      this.ws.send(message);
    } else {
      this.messageQueue.push(message);
    }
  }

  on(event, callback) {
    this.eventHandlers[event] = callback;
  }

  async require(moduleName) {
    return new Promise((resolve, reject) => {
      if (this.moduleCache.has(moduleName)) {
        resolve(this.moduleCache.get(moduleName));
        return;
      }
      this.moduleCallbacks.set(moduleName, { resolve, reject });
      this.emit('require', { moduleName, hash: null });
    });
  }

  handleModuleResponse(data) {
    const { name, content, hash, upToDate } = data;
    if (!upToDate) {
      const moduleExports = {};
      const moduleFunction = new Function('exports', 'require', content);
      const mockRequire = (moduleName) => this.require(moduleName);
      moduleFunction(moduleExports, mockRequire);
      this.moduleCache.set(name, { exports: moduleExports, hash });
    }
    const callbacks = this.moduleCallbacks.get(name);
    if (callbacks) {
      callbacks.resolve(this.moduleCache.get(name).exports);
      this.moduleCallbacks.delete(name);
    }
  }

  handleAuthSuccess(data) {
    localStorage.setItem('authToken', data.token);
    this.token = data.token;
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
    this.emit('logout');
  }
}

window.CentralStation = CentralStation;