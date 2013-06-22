define([
       'jquery',
       'underscore',
       'backbone',
       'moment',
       'channel',
       'text!templates/timeline-header.html'
], function($, _, Backbone, moment, channel, tpl){
  return Backbone.View.extend({

    clasName: 'row',

    events : {
      'click button.sort-items' : 'sortItemsHandler',
      'click button.mark-items' : 'markAllItemsHandler',
      'click button.show-items' : 'showItemsHandler'
    },

    options: {
      timeline: 'global',
      isShowingAllItems: false,
      order: 'ASC',
      feed: null
    },

    initialize: function() {
      this.listenTo(channel, 'app.event.timeline.refresh', this.updateOptions);
      this.listenTo(channel, 'app.event.timeline.size', this.updateTimelineSizeHandler);
      this.fetchTimelineStatus();
    },

    close: function() {
      this.stopListening();
      this.remove();
      this.unbind();
    },

    getTimelineStatusUrl: function() {
      return 'timeline/' + this.options.timeline + '/status';
    },

    fetchTimelineStatus: function() {
      $.getJSON(this.getTimelineStatusUrl()).done(function(ts) {
        if (ts.feed) {
          var obj = {
            statusLabel: 'Not updated',
            statusDesc: 'This feed had not yet been parsed.',
            updatedFrom: moment(ts.feed.updateDate).fromNow()
          };
          if (ts.feed.status) {
            var parts = ts.feed.status.split(':');
            if (parts[0] == 'error') {
              obj.statusLabel = 'In error';
              obj.statusDesc = ts.feed.status;
            } else {
              obj.statusLabel = ts.feed.status;
              obj.statusDesc = '';
            }
          }
          ts.feed = _.extend(ts.feed, obj);
        }
        this.updateOptions(ts);
      }.bind(this));
    },

    render: function() {
      this.$el.html(_.template(tpl, this.options));
    },

    updateOptions: function(options) {
      this.options = _.extend(this.options, options);
      this.options.hasAllItems = (this.options.timeline != 'archive' &&
                                  this.options.timeline != 'global');
      this.options.isReadable = (this.options.timeline !== 'archive' &&
                                 !this.options.isShowingAllItems);
      this.options.showItemsLabel = this.options.isShowingAllItems ?
        'Show new iems' : 'Show all items';
      this.options.showItemsClass = this.options.isShowingAllItems ?
        'icon-fire' : 'icon-eye-open';
      this.options.sortLabel = this.options.order == 'ASC' ?
        'Sort by newest' : 'Sort by oldest';
      this.options.sortClass = this.options.order == 'ASC' ?
        'icon-chevron-down' : 'icon-chevron-up';
      this.options.sizeLabel = this.options.timeline == 'archive' ?
        'saved articles' : 'unread articles';
      channel.trigger('app.event.timeline.size', this.options);
      this.render();
    },

    updateTimelineSizeHandler: function(data) {
      if (data.timeline == this.options.timeline) {
        $('span.hint b', this.$el).text(data.size);
      }
    },

    sortItemsHandler: function(event) {
      var options = {
        order: (this.options.order === 'ASC') ? 'DESC' : 'ASC'
      }
      channel.trigger('app.event.timeline.refresh', options);
      return false;
    },

    showItemsHandler: function(event) {
      var options = {
        isShowingAllItems: !this.options.isShowingAllItems
      }
      channel.trigger('app.event.timeline.refresh', options);
      return false;
    },

    markAllItemsHandler: function(event) {
      channel.trigger('app.event.timeline.markall');
      return false;
    }
  });
});
