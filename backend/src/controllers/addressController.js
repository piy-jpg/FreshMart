const { db } = require('../config/database');
module.exports = {
  list: (req, res) => res.json(db.getAll('addresses'))
};
