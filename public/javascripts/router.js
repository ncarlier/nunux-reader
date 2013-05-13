define([
       'backbone'
], function(Backbone){
  return Backbone.Router.extend({
    routes: {
      'all':       'showGlobalTimeline',
      'archive':   'showArchiveTimeline',
      'import':    'showImport',
      'subscribe': 'showSubscribe',
      'about':     'showAbout',
      '':          'showGlobalTimeline'
    },

    views: {},

    showGlobalTimeline: function() {
      this.registerView('sidebar', '#sidebar');
      this.registerView('timeline', '#main');
    },

    showArchiveTimeline: function() {
      this.registerView('sidebar', '#sidebar');
      this.registerView('timeline', '#main', {timeline: 'archive'});
    },

    showImport: function() {
      this.registerView('sidebar', '#sidebar');
      this.registerView('import', '#main');
    },

    showSubscribe: function() {
      this.registerView('sidebar', '#sidebar');
      this.registerView('subscribe', '#main');
    },

    showAbout: function() {
      this.registerView('sidebar', '#sidebar');
      this.registerView('about', '#main');
    },

    registerView: function(view, el, options) {
      require(['views/' + view], function(View) {
        if (this.views[el] && this.views[el] instanceof View) {
          if (typeof this.views[el].refresh == 'function') 
            this.views[el].refresh(options);
        } else {
          if (this.views[el]) this.views[el].remove();
          this.views[el] = new View(options);
          this.views[el].render();
          $(el).html(this.views[el].$el);
        }
      }.bind(this));
    },

    initialize: function(){
      Backbone.history.start();
    }
  });
});
