define([
       'backbone',
], function(Backbone){
  return Backbone.Router.extend({
    routes: {
      'all':     'showGlobalTimeline',
      'archive': 'showArchiveTimeline',
      '':        'showGlobalTimeline'
    },

    showGlobalTimeline: function() {
      require(['views/aside', 'views/timeline'], function(AsideView, TimelineView) {
        if (!this.asideView) {
          this.asideView = new AsideView();
          this.asideView.render();
          $('#container').append(this.asideView.$el);
        }
        if (!this.timelineView) {
          this.timelineView = new TimelineView();
          this.timelineView.render();
          $('#container').append(this.timelineView.$el);
        }
      }.bind(this));
    },

    showArchiveTimeline: function() {
      if (this.asideView) {
        this.asideView.remove();
        this.asideView = null;
      }
    },

    initialize: function(){
      Backbone.history.start();
    }
  });
});
