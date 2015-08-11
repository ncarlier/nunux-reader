'use strict';

var logger = require('../helpers').logger;

var EMBEDDED_DAEMONS = process.env.APP_EMBEDDED_DAEMONS;

var daemons = EMBEDDED_DAEMONS ? EMBEDDED_DAEMONS.split(',') : [];

/**
 * Embedded daemons.
 * @module daemon
 */
module.exports = {
  start: function() {
    for (var i = 0; i < daemons.length; i++) {
      var daemon = daemons[i];
      logger.debug('Loading %s embedded daemon...', daemon);
      require('./' + daemon + '.js').start();
    }
  },
  shutdown: function() {
    for (var i = 0; i < daemons.length; i++) {
      var daemon = daemons[i];
      require('./' + daemon + '.js').stop();
    }
  }
};
