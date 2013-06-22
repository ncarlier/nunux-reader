define([
       'jquery',
       'underscore',
       'backbone',
       'moment',
       'channel',
       'views/timeline-header',
       'views/timeline-content',
       'text!templates/timeline.html',
], function($, _, Backbone, moment, channel, TimelineHeader, TimelineContent, tpl){
  return Backbone.View.extend({

    className: 'timeline',

    options: {
      timeline: 'global'
    },

    render: function() {
      this.$el.html(_.template(tpl, {}));
      // Render header
      this.header = new TimelineHeader(this.options);
      this.$header = $('> header', this.$el);
      this.$header.html(this.header.$el);
      // Render content
      this.content = new TimelineContent(this.options);
      this.$content = $('> section', this.$el);
      this.$content.html(this.content.$el);
    }
  });
});
