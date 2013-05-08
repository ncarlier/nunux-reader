define([
       'backbone',
       'channel'
], function(Backbone, channel){
  return Backbone.Router.extend({
    routes: {
      'all':       'showGlobalTimeline',
      'archive':   'showArchiveTimeline',
      'import':    'showImport',
      'subscribe': 'showSubscribe',
      '':          'showGlobalTimeline'
    },

    showGlobalTimeline: function() {
      this._showView('sidebar', '#sidebar');
      this._hideView('articles');
      this._showView('articles', '#main');
      channel.trigger('app.event.route', {route: 'all'});
    },

    showArchiveTimeline: function() {
      this._showView('sidebar', '#sidebar');
      this._hideView('articles');
      this._showView('articles', '#main', {archive: true});
      channel.trigger('app.event.route', {route: 'archive'});
    },

    showImport: function() {
      this._showView('sidebar', '#sidebar');
      this._showView('import', '#main');
    },

    showSubscribe: function() {
      this._showView('sidebar', '#sidebar');
      this._showView('subscribe', '#main');
    },

    _showView: function(view, el, options) {
      require(['views/' + view], function(View) {
        var viewName = view + 'View';
        if (!this[viewName]) {
          this[viewName] = new View(options);
          this[viewName].render();
          $(el).append(this[viewName].$el);
        }
      }.bind(this));
    },

    _hideView: function(view) {
      var viewName = view + 'View';
      if (this[viewName]) {
        this[viewName].remove();
        this[viewName] = null;
      }
    },

    initialize: function(){
      Backbone.history.start();
    }
  });
});
