#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Create project directory structure
mkdir -p central-station/src/components
mkdir -p central-station/src/services
mkdir -p central-station/src/utils
mkdir -p central-station/dist
mkdir -p central-station/test
mkdir -p central-station/scripts

# Create package.json
cat <<EOL > central-station/package.json
{
  "name": "central-station",
  "version": "1.0.0",
  "description": "A library for managing central station operations",
  "main": "dist/index.js",
  "scripts": {
    "build": "babel src --out-dir dist",
    "test": "jest",
    "prepublishOnly": "npm run build && npm test"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/yourusername/central-station.git"
  },
  "keywords": [
    "central",
    "station",
    "library"
  ],
  "author": "Your Name",
  "license": "MIT",
  "devDependencies": {
    "babel-cli": "^6.26.0",
    "babel-preset-env": "^1.7.0",
    "jest": "^26.0.0",
    "preact": "^10.5.13"
  }
}
EOL

# Create .babelrc
cat <<EOL > central-station/.babelrc
{
  "presets": ["env"]
}
EOL

# Create README.md
cat <<EOL > central-station/README.md
# Central Station

A library for managing central station operations.

## Installation

\`\`\`bash
npm install central-station
\`\`\`

## Usage

\`\`\`javascript
const CentralStation = require('central-station');

const cs = new CentralStation();
cs.on('init', (data) => {
  console.log('Initialized with data:', data);
});
\`\`\`

## API

### \`new CentralStation()\`
Creates a new instance of CentralStation.

### \`cs.on(event, callback)\`
Registers an event handler for the specified event.

### \`cs.emit(event, data)\`
Emits an event to the server with the specified data.

### \`cs.route(path, callback)\`
Defines a route and its callback.

### \`cs.navigate(path)\`
Navigates to the specified path.

### \`cs.login(username, password)\`
Logs in a user.

### \`cs.signup(username, password)\`
Signs up a new user.

### \`cs.logout()\`
Logs out the current user.
EOL

# Create LICENSE
cat <<EOL > central-station/LICENSE
MIT License

Copyright (c) 2023 Your Name

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
EOL

# Create src files
cat <<EOL > central-station/src/CentralStation.js
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
EOL

cat <<EOL > central-station/src/components/App.js
import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import CentralStation from '../CentralStation';
import Login from './Login';
import Dashboard from './Dashboard';

const cs = new CentralStation();

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    cs.on('login', () => setIsAuthenticated(true));
    cs.on('logout', () => setIsAuthenticated(false));
  }, []);

  return (
    <div>
      {isAuthenticated ? <Dashboard /> : <Login />}
    </div>
  );
};

export default App;
EOL

cat <<EOL > central-station/src/components/Login.js
import { h } from 'preact';
import { useState } from 'preact/hooks';
import CentralStation from '../CentralStation';

const cs = new CentralStation();

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    cs.login(username, password);
  };

  return (
    <div>
      <input type="text" value={username} onInput={(e) => setUsername(e.target.value)} placeholder="Username" />
      <input type="password" value={password} onInput={(e) => setPassword(e.target.value)} placeholder="Password" />
      <button onClick={handleLogin}>Login</button>
    </div>
  );
};

export default Login;
EOL

cat <<EOL > central-station/src/components/Dashboard.js
import { h } from 'preact';

const Dashboard = () => {
  return (
    <div>
      <h1>Welcome to the Dashboard</h1>
    </div>
  );
};

export default Dashboard;
EOL

cat <<EOL > central-station/src/index.js
import { h, render } from 'preact';
import App from './components/App';

render(<App />, document.body);
EOL

cat <<EOL > central-station/src/services/websocket.js
export function connectWebSocket(url, onMessage) {
  const ws = new WebSocket(url);
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    onMessage(data);
  };
  return ws;
}
EOL

cat <<EOL > central-station/src/services/auth.js
export function login(username, password) {
  // Implement login logic
  return Promise.resolve('fake-token');
}

export function signup(username, password) {
  // Implement signup logic
  return Promise.resolve('fake-token');
}

export function logout() {
  // Implement logout logic
}
EOL

cat <<EOL > central-station/src/utils/routes.js
const routes = {};

export function addRoute(path, callback) {
  routes[path] = callback;
}

export function getRoute(path) {
  return routes[path];
}

export default routes;
EOL

cat <<EOL > central-station/src/utils/events.js
const events = {};

export function addEvent(event, callback) {
  if (!events[event]) {
    events[event] = [];
  }
  events[event].push(callback);
}

export function emitEvent(event, data) {
  if (events[event]) {
    events[event].forEach(callback => callback(data));
  }
}

export default events;
EOL

# Create test file
cat <<EOL > central-station/test/CentralStation.test.js
const CentralStation = require('../src/CentralStation');
const { addEvent, emitEvent } = require('../src/utils/events');
const { addRoute, getRoute } = require('../src/utils/routes');

jest.mock('../src/services/websocket', () => ({
  connectWebSocket: jest.fn((url, onMessage) => ({
    send: jest.fn(),
    onmessage: onMessage,
  })),
}));

jest.mock('../src/services/auth', () => ({
  login: jest.fn(() => Promise.resolve('fake-token')),
  signup: jest.fn(() => Promise.resolve('fake-token')),
  logout: jest.fn(),
}));

describe('CentralStation', () => {
  let cs;

  beforeEach(() => {
    cs = new CentralStation();
  });

  test('initializes correctly', () => {
    expect(cs).toBeDefined();
  });

  test('handles WebSocket messages', () => {
    const message = { event: 'testEvent', payload: 'testPayload' };
    cs.ws.onmessage({ data: JSON.stringify(message) });
    expect(cs.ws.onmessage).toBeDefined();
  });

  test('emits events', () => {
    const event = 'testEvent';
    const data = 'testData';
    cs.emit(event, data);
    expect(cs.ws.send).toHaveBeenCalledWith(JSON.stringify({ event, data }));
  });

  test('registers event handlers', () => {
    const event = 'testEvent';
    const callback = jest.fn();
    cs.on(event, callback);
    emitEvent(event, 'testData');
    expect(callback).toHaveBeenCalledWith('testData');
  });

  test('handles routes', () => {
    const path = '/test';
    const callback = jest.fn();
    cs.route(path, callback);
    cs.navigate(path);
    expect(callback).toHaveBeenCalled();
  });

  test('login', async () => {
    await cs.login('username', 'password');
    expect(cs.token).toBe('fake-token');
  });

  test('signup', async () => {
    await cs.signup('username', 'password');
    expect(cs.token).toBe('fake-token');
  });

  test('logout', () => {
    cs.logout();
    expect(cs.token).toBeNull();
  });
});
EOL

# Navigate to project directory
cd central-station

# Initialize npm and install dependencies
npm install

# Run tests
npm test

# Build the project
npm run build

echo "Setup complete!"