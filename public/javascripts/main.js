require.config({
  paths: {
    jquery:     '../lib/jquery/jquery',
    underscore: '../lib/underscore-amd/underscore',
    backbone:   '../lib/backbone-amd/backbone',
    text:       '../lib/requirejs-text/text',
    moment:     '../lib/moment/moment',
    templates:  '../templates'
  }
});

require(['app']);
