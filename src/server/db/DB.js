const DBJson = require('./dbjson');
const DBMongo = require('./dbmongo');

function DB({ type = 'default', ...options }) {
  let driver = {
    'json': () => new DBJson(options),
    'mongo': () => new DBMongo(options),
    'default': () => { throw new Error(`Unsupported database type: ${this.type}`) }
  }
  return driver[type]()
}

module.exports = DB;