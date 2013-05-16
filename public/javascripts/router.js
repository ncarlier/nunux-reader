define([
       'backbone'
], function(Backbone){
  return Backbone.Router.extend({
    routes: {
      'timeline/:timeline': 'showTimeline',
      'manage':             'showManage',
      'about':              'showAbout',
      '':                   'showTimeline'
    },

    views: {},

    showTimeline: function(timeline) {
      var t = (typeof timeline == 'undefined') ? 'global' : timeline;
      this.registerView('sidebar', '#sidebar');
      this.registerView('timeline', '#main', {timeline: t});
    },

    showManage: function() {
      this.registerView('sidebar', '#sidebar');
      this.registerView('manage', '#main');
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
          this.unRegisterView(el);
          if (this.views[el]) this.views[el].remove();
          this.views[el] = new View(options);
          this.views[el].render();
          $(el).html(this.views[el].$el);
        }
      }.bind(this));
    },

    unRegisterView: function(el) {
      if (this.views[el]) this.views[el].remove();
    },

    initialize: function(){
      Backbone.history.start();
    }
  });
});
