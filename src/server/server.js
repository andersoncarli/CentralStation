const CentralStation = require('./CentralStation');
const debug = require('debug')('cs:server');

const cs = new CentralStation({
  port: 3000,
  jwtSecret: 'your-secret-key',
  dbOptions: { type: 'json', dataDir: './data' },
  modulesDir: 'modules'
});

cs.start().then(() => {
  debug('CentralStation started');
  setInterval(() => {
    const time = new Date().toISOString();
    cs.clients.forEach(hub => {
      if (hub.username) {
        hub.emit('timeUpdate', time);
        debug(`Time update sent to ${hub.username}`);
      }
    });
  }, 1000);

  cs.wss.on('connection', (ws) => {
    const hub = Array.from(cs.clients.values()).find(h => h.ws === ws);
    ws.on('message', (message) => {
      try {
        const { event, data } = JSON.parse(message);
        if (event === 'mouseMove' && hub) {
          debug(`Mouse moved for ${hub.username}: ${JSON.stringify(data)}`);
        }
      } catch (error) {
        debug('Failed to process message:', error);
      }
    });
  });
});
