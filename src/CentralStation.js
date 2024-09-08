import { addEvent, emitEvent } from './utils/events';
import { addRoute, getRoute } from './utils/routes';
import { connectWebSocket, handleWebSocketMessage } from './services/websocket';
import { login, signup, logout } from './services/auth';

class CentralStation {
  constructor() {
    this.ws = connectWebSocket('ws://localhost:3000', this.handleMessage.bind(this));
    this.token = null;
    this.currentRoute = null;

    window.addEventListener('popstate', this.handlePopState.bind(this));
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

export default CentralStation;
