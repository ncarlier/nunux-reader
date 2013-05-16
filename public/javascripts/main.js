require.config({
  shim: {
    bootstrap: {
      deps: ['jquery']
    }
  },
  paths: {
    jquery:     '../lib/jquery/jquery',
    underscore: '../lib/underscore-amd/underscore',
    backbone:   '../lib/backbone-amd/backbone',
    text:       '../lib/requirejs-text/text',
    moment:     '../lib/moment/moment',
    bootstrap:  '../lib/bootstrap.css/js/bootstrap',
    templates:  '../templates'
  }
});

require(['app', 'bootstrap']);
