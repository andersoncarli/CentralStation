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
});