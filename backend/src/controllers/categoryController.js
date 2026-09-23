const Category = require('../models/Category');
module.exports = {
  list: (req, res) => res.json(Category.ALL)
};
