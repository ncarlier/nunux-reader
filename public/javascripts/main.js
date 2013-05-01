require.config({
  paths: {
    jquery:     'components/jquery/jquery',
    underscore: 'components/underscore-amd/underscore',
    backbone:   'components/backbone-amd/backbone',
    text:       'components/requirejs-text/text',
    moment:     'components/moment/moment',
    templates:   '../templates'
  }
});

require(['app']);
