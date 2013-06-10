define([
       'backbone',
       'views/sidebar'
], function(Backbone, SidebarView){
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
      this.registerView('timeline', '#content-inner', {timeline: t});
    },

    showManage: function() {
      this.registerView('manage', '#content-inner');
    },

    showAbout: function() {
      this.registerView('about', '#content-inner');
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
      // Build sidebar.
      this.sidebar = new SidebarView();
      this.sidebar.$el = $('#sidebar');
      this.sidebar.render();

      $(document).on('webkitvisibilitychange', function() {
        if (!document.webkitHidden) {
          for (var v in this.views) {
            if (typeof this.views[v].refresh == 'function') 
              this.views[v].refresh();
          }
        }
      }.bind(this));
    }
  });
});
