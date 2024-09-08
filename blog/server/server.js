const CentralStation = require('./CentralStation');
const debug = require('debug')('cs:server');

const cs = new CentralStation({
  port: 3000,
  jwtSecret: 'your-secret-key',
  usersFile: './data/users.json',
  modulesDir: 'modules'
});

cs.start().then(() => {
  debug('CentralStation started');
});