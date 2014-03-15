/**
 * API
 */
module.exports = {
  info: function(req, res) {
    res.json(req.context.info);
  },
  pubsubhubbud: require('./pubsubhubbud'),
  subscription: require('./subscription'),
  timeline:     require('./timeline'),
  archive:      require('./archive'),
  admin:        require('./admin'),
  user:         require('./user')
};
