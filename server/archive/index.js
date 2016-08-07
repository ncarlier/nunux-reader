var KeeperProvider = require('./keeper'),
    KeeperV2Provider = require('./keeper-v2'),
    PocketProvider = require('./pocket'),
    DropboxProvider = require('./dropbox');

var providers = {
  keeper: new KeeperProvider(),
  'keeper-v2': new KeeperV2Provider(),
  pocket: new PocketProvider(),
  dropbox: new DropboxProvider()
};

module.exports = {
  providers: providers
};
