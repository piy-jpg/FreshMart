const path = require('path');
// Shared database engine singleton reference
const db = require('../../../database.js');

module.exports = {
  db,
  getCollection: (collectionName) => db.getAll(collectionName),
  getById: (collectionName, id) => db.getById(collectionName, id),
  insert: (collectionName, item) => db.insert(collectionName, item),
  update: (collectionName, id, item) => db.update(collectionName, id, item),
  remove: (collectionName, id) => db.remove(collectionName, id),
  save: () => db.save()
};
