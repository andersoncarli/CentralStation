const CentralStation = require('./CentralStation');

const cs = new CentralStation({
  port: 3000,
  jwtSecret: 'your-secret-key',
  usersFile: 'users.json',
  modulesDir: 'modules'
});

cs.start().then(() => {
  setInterval(() => {
    const time = new Date().toISOString();
    cs.clients.forEach(hub => hub.username && hub.emit('timeUpdate', time));
  }, 1000);

  cs.wss.on('connection', (ws) => {
    const hub = Array.from(cs.clients.values()).find(h => h.ws === ws);
    ws.on('message', (message) => {
      try {
        const { event, data } = JSON.parse(message);
        if (event === 'mouseMove' && hub) {
          console.log(`Mouse moved for ${hub.username}: ${JSON.stringify(data)}`);
        }
      } catch (error) {
        console.error('Failed to process message:', error);
      }
    });
  });
});
