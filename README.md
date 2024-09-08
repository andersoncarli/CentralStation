# Central Station

Central Station is an innovative Client/Server communication library that revolutionizes real-time web applications by providing a robust, stateful communication framework that simplifies complex client-server interactions.

## Key Innovations

1. **Dedicated WebSocket Connections**: Unlike traditional architectures, Central Station establishes a persistent, dedicated WebSocket connection for each client. This approach enables:
   - Real-time, bidirectional communication
   - Stateful connections, reducing the need for constant authentication
   - Improved performance by eliminating connection setup overhead

2. **Dynamic Module Loading**: Central Station introduces a unique module system that:
   - Loads server-side modules on-demand
   - Caches modules for improved performance
   - Manages dependencies automatically
   - Ensures clients always have the latest module versions

3. **Integrated Authentication and State Management**: The library seamlessly handles:
   - User authentication using JWT
   - State synchronization between client and server
   - Secure, stateful sessions without relying on cookies

4. **Client-Side Routing with Server Awareness**: Central Station provides a routing system that:
   - Enables single-page application (SPA) functionality
   - Keeps the server informed about client-side navigation
   - Allows for server-side logic tied to client routes

## Problems Solved

Here are some problems that Central Station solves:

1. **Real-Time Communication Complexity**: Traditional HTTP request-response cycles are inadequate for real-time applications. Central Station's WebSocket-based approach provides a natural solution for real-time, bidirectional communication.

2. **State Management Across Client-Server Boundary**: Maintaining consistent state between client and server is challenging. Central Station's integrated state management simplifies this process, ensuring data consistency.

3. **Module Version Mismatches**: In traditional systems, client-side and server-side code can become out of sync. Central Station's dynamic module loading ensures clients always use the latest server-side logic.

4. **Authentication in Real-Time Applications**: Authenticating every request in a real-time application can be inefficient. Central Station's stateful connections allow for persistent authentication, improving performance and security.

5. **Complex Setup for Real-Time Features**: Implementing real-time features often requires complex server setups. Central Station provides these capabilities out-of-the-box, simplifying development.

## Benefits

Central Station offers several key benefits that make it an attractive choice for developers:

1. **Simplicity**: The library abstracts away the complexities of real-time communication, state management, and authentication, allowing developers to focus on building features.

2. **Performance**: By using dedicated WebSocket connections and dynamic module loading, Central Station ensures high performance and low latency.

3. **Security**: Integrated JWT authentication and stateful sessions provide robust security without the need for additional configuration.

4. **Flexibility**: The client-side routing system and server-side module management offer flexibility in building both simple and complex applications.

5. **Consistency**: State synchronization and automatic module updates ensure that clients and servers remain in sync, reducing bugs and inconsistencies.

## Getting Started

### Installation

To install Central Station, use npm:

```bash
npm install central-station
```

### Server-Side Usage

```javascript
const CentralStation = require('central-station');
const cs = new CentralStation({
  port: 3000,
  jwtSecret: 'your-secret-key',
  usersFile: 'path/to/users.json',
  modulesDir: 'path/to/modules'
});

cs.start((data) => {
  console.log('Initialized with data:', data);
});
```

### Client-Side Usage

Use cs methods for communication

```javascript
import CentralStation from 'central-station/src/client';
const cs = new CentralStation({ url:'ws://localhost:3000' });

cs.route('/dashboard', async () => {
if (!cs.token) return cs.navigate('/login');
document.body.innerHTML = `
<h1>Dashboard</h1>
  <p>Welcome, <span id="username"></span>!</p>
  <div id="time"></div>
    <button id="logoutBtn">Logout</button>`

document.getElementById('logoutBtn').onclick = () => cs.logout();
const timeFormatter = await cs.require('timeFormatter');
cs.on('time', (time) => {
const formattedTime = timeFormatter.format(time);
document.getElementById('time').textContent = formattedTime;
});
});
cs.login('username', 'password');
```

## Basic API

### `new CentralStation()`
Creates a new instance of CentralStation.

### `cs.on(event, callback)`
Registers an event handler for the specified event.

### `cs.emit(event, data)`
Emits an event to the server with the specified data.

### `cs.route(path, callback)`
Defines a route and its callback.

### `cs.navigate(path)`
Navigates to the specified path.

### `cs.login(username, password)`
Logs in a user.

### `cs.signup(username, password)`
Signs up a new user.

### `cs.logout()`
Logs out the current user.

## License

This project is licensed under the MIT License. See the LICENSE file for details.
