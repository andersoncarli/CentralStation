const DBJson = require('./dbjson');
const DBMongo = require('./dbmongo');

class DB {
  constructor(type, options) {
    this.type = type;
    this.options = options;
    this.implementation = null;
  }

  async connect() {
    switch (this.type) {
      case 'json':
        this.implementation = new DBJson(this.options);
        break;
      case 'mongo':
        this.implementation = new DBMongo(this.options);
        break;
      default:
        throw new Error(`Unsupported database type: ${this.type}`);
    }
    await this.implementation.connect();
  }

  async findOne(collection, query) {
    return this.implementation.findOne(collection, query);
  }

  async findMany(collection, query) {
    return this.implementation.findMany(collection, query);
  }

  async create(collection, data) {
    return this.implementation.create(collection, data);
  }

  async update(collection, query, data) {
    return this.implementation.update(collection, query, data);
  }

  async delete(collection, query) {
    return this.implementation.delete(collection, query);
  }
}

module.exports = DB;