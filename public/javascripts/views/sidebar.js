define([
       'jquery',
       'underscore',
       'backbone',
       'channel',
       'collections/feeds',
       'text!templates/sidebar.html',
       'text!templates/sidebar-feed.html'
], function($, _, Backbone, channel, Feeds, sidebarTpl, sidebarFeedTpl){
  return Backbone.View.extend({

    initialize: function () {
      channel.on('app.event.timelinesize', function (data) {
        var selector = '.menu-' + data.timeline + '-timeline .size'
        selector = selector.replace(':', '\\:');
        $(selector, this.$el).text(data.total).toggle(data.total > 0);
      }.bind(this));
      channel.on('app.event.timelinechange', function (data) {
        var selector = '.menu-' + data.timeline + '-timeline';
        selector = selector.replace(':', '\\:');
        $('li', this.$el).removeClass('current_page_item');
        $(selector, this.$el).parent().addClass('current_page_item');
      }.bind(this));
    },

    render: function() {
      this.$el.delegate('li > a', 'click', function(event) {
        $('li', this.$el).removeClass('current_page_item');
        var $li = $(event.target).parents('li');
        $li.addClass('current_page_item');
        // Hide side bar on mobile view
        this.$el.toggle($('#logo').is(':visible'));
      }.bind(this));

      var $sidebar = _.template(sidebarTpl, {});
      this.$el.html($sidebar);
      this.$subscriptions = $('.is-subscriptions', this.$el);
      this.$feeds = $('ul', this.$subscriptions);
      this.feeds = new Feeds();
      this.listenTo(this.feeds, 'sort', this.renderSubscriptions);
      this.feeds.fetch({sort: true});
    },

    renderSubscriptions: function(feeds) {
      $('header .size', this.$subscriptions).text('(' + feeds.length + ')');
      feeds.each(function(feed) {
        var $feed = _.template(sidebarFeedTpl, feed.toJSON());
        this.$feeds.append($feed);
      }.bind(this));
    }
  });
});
