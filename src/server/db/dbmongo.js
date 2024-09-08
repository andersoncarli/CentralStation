const { MongoClient } = require('mongodb');

class DBMongo {
  constructor(options) {
    this.url = options.url || 'mongodb://localhost:27017';
    this.dbName = options.dbName || 'centralstation';
    this.client = null;
    this.db = null;
  }

  async connect() {
    this.client = await MongoClient.connect(this.url);
    this.db = this.client.db(this.dbName);
  }

  async findOne(collection, query) {
    return this.db.collection(collection).findOne(query);
  }

  async findMany(collection, query) {
    return this.db.collection(collection).find(query).toArray();
  }

  async create(collection, data) {
    const result = await this.db.collection(collection).insertOne(data);
    return { ...data, _id: result.insertedId };
  }

  async update(collection, query, data) {
    const result = await this.db.collection(collection).findOneAndUpdate(
      query,
      { $set: data },
      { returnDocument: 'after' }
    );
    return result.value;
  }

  async delete(collection, query) {
    const result = await this.db.collection(collection).deleteOne(query);
    return result.deletedCount > 0;
  }
}

module.exports = DBMongo;