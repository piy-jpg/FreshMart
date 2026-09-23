const environment = require('./environment');
const appConfig = require('./appConfig');

module.exports = {
  ...environment,
  ...appConfig
};
