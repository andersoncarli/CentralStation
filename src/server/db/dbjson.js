const fs = require('fs').promises;
const path = require('path');

class DBJson {
  constructor(options) {
    this.dataDir = options.dataDir || path.join(process.cwd(), 'data');
    this.collections = {};
  }

  async connect() {
    await fs.mkdir(this.dataDir, { recursive: true });
    const files = await fs.readdir(this.dataDir);
    for (const file of files) {
      if (file.endsWith('.json')) {
        const collectionName = path.basename(file, '.json');
        const data = await fs.readFile(path.join(this.dataDir, file), 'utf-8');
        this.collections[collectionName] = JSON.parse(data);
      }
    }
  }

  async _saveCollection(collectionName) {
    const filePath = path.join(this.dataDir, `${collectionName}.json`);
    await fs.writeFile(filePath, JSON.stringify(this.collections[collectionName], null, 2));
  }

  async findOne(collection, query) {
    return this.collections[collection].find(item =>
      Object.entries(query).every(([key, value]) => item[key] === value)
    );
  }

  async findMany(collection, query) {
    return this.collections[collection].filter(item =>
      Object.entries(query).every(([key, value]) => item[key] === value)
    );
  }

  async create(collection, data) {
    if (!this.collections[collection]) {
      this.collections[collection] = [];
    }
    this.collections[collection].push(data);
    await this._saveCollection(collection);
    return data;
  }

  async update(collection, query, data) {
    const index = this.collections[collection].findIndex(item =>
      Object.entries(query).every(([key, value]) => item[key] === value)
    );
    if (index !== -1) {
      this.collections[collection][index] = { ...this.collections[collection][index], ...data };
      await this._saveCollection(collection);
      return this.collections[collection][index];
    }
    return null;
  }

  async delete(collection, query) {
    const initialLength = this.collections[collection].length;
    this.collections[collection] = this.collections[collection].filter(item =>
      !Object.entries(query).every(([key, value]) => item[key] === value)
    );
    if (this.collections[collection].length !== initialLength) {
      await this._saveCollection(collection);
      return true;
    }
    return false;
  }
}

module.exports = DBJson;