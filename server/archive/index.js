var KeeperProvider = require('./keeper'),
    PocketProvider = require('./pocket'),
    DropboxProvider = require('./dropbox');

var providers = {
  keeper: new KeeperProvider(),
  pocket: new PocketProvider(),
  dropbox: new DropboxProvider()
};

module.exports = {
  providers: providers
};
