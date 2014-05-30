var KeeperProvider = require('./keeper'),
    PocketProvider = require('./pocket');

var providers = {
  keeper: new KeeperProvider(),
  pocket: new PocketProvider()
};

module.exports = {
  providers: providers
};
