define([
       'backbone',
], function(Backbone){
  return Backbone.Router.extend({
    routes: {
      'all':       'showGlobalTimeline',
      'archive':   'showArchiveTimeline',
      'import':    'showImport',
      'subscribe': 'showSubscribe',
      '':          'showGlobalTimeline'
    },

    showGlobalTimeline: function() {
      this._hideViews('import', 'subscribe');
      this._showViews('aside', 'timeline');
    },

    showArchiveTimeline: function() {
      this._hideViews('import', 'subscribe');
      this._showViews('aside', 'timeline');
    },

    showImport: function() {
      this._hideViews('timeline', 'subscribe');
      this._showViews('aside', 'import');
    },

    showSubscribe: function() {
      this._hideViews('timeline', 'import');
      this._showViews('aside', 'subscribe');
    },

    _showViews: function() {
      for (var i in arguments) {
        this._showView(arguments[i]);
      }
    },

    _hideViews: function() {
      for (var i in arguments) {
        this._hideView(arguments[i]);
      }
    },

    _showView: function(view) {
      require(['views/' + view], function(View) {
        var viewName = view + 'View';
        if (!this[viewName]) {
          this[viewName] = new View();
          this[viewName].render();
          $('#container').append(this[viewName].$el);
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
