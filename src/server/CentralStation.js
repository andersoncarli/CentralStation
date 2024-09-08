// server/CentralStation.js
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { addEvent, emitEvent } = require('./utils/events');
const { addRoute, getRoute } = require('./utils/routes');
const { connectWebSocket, handleWebSocketMessage } = require('./services/websocket');
const { login, signup, logout } = require('./services/auth');

class CentralStation {
  constructor(options = { port: 3000 }) {
    this.options = {
      port: options.port,
      jwtSecret: options.jwtSecret || 'your-secret-key',
      usersFile: options.usersFile || 'users.json',
      modulesDir: options.modulesDir || 'modules'
    };

    this.clients = new Map();
    this.modules = new Map();

    this.server = null;
    this.wss = null;

    this.ws = connectWebSocket('ws://localhost:3000', this.handleMessage.bind(this));
    this.token = null;
    this.currentRoute = null;

    window.addEventListener('popstate', this.handlePopState.bind(this));
  }

  start() {
    this.server = http.createServer(this.handleHttpRequest.bind(this));
    this.wss = new WebSocket.Server({ server: this.server });
    this.wss.on('connection', this.handleWebSocketConnection.bind(this));

    this.loadAllModules().then(() => {
      this.server.listen(this.options.port, () => {
        console.log(`CentralStation server running on http://localhost:${this.options.port}`);
      });
    });
  }

  handleMessage(data) {
    const { event, payload } = data;
    emitEvent(event, payload);
  }

  emit(event, data) {
    this.ws.send(JSON.stringify({ event, data }));
  }

  on(event, callback) {
    addEvent(event, callback);
  }

  route(path, callback) {
    addRoute(path, callback);
  }

  navigate(path) {
    history.pushState({}, '', path);
    this.handleRoute(path);
  }

  handlePopState() {
    this.handleRoute(window.location.pathname);
  }

  handleRoute(path) {
    const route = getRoute(path);
    if (route) {
      route();
    }
  }

  login(username, password) {
    return login(username, password).then(token => {
      this.token = token;
      this.emit('login', { token });
    });
  }

  signup(username, password) {
    return signup(username, password).then(token => {
      this.token = token;
      this.emit('signup', { token });
    });
  }

  logout() {
    logout();
    this.token = null;
    this.emit('logout');
  }
}

module.exports = CentralStation;