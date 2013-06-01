define([
       'jquery',
       'underscore',
       'backbone',
       'channel',
       'text!templates/sidebar.html',
       'text!templates/sidebar-feed.html'
], function($, _, Backbone, channel, sidebarTpl, sidebarFeedTpl){
  return Backbone.View.extend({

    initialize: function () {
      channel.on('app.event.timelinesize', function (data) {
        var selector = '.menu-' + data.timeline + '-timeline .size'
        selector = selector.replace(':', '\\:');
        $(selector, this.$el).text('(' + data.total + ')').parent().toggleClass('bold', data.total > 0);
      }.bind(this));
      channel.on('app.event.timelinechange', function (data) {
        var selector = '.menu-' + data.timeline + '-timeline';
        selector = selector.replace(':', '\\:');
        $('li', this.$el).removeClass('current_page_item');
        $(selector, this.$el).parent().addClass('current_page_item');
      }.bind(this));
    },

    render: function() {
      var $sidebar = _.template(sidebarTpl, {});
      this.$el.html($sidebar);
      this.$subscriptions = $('.is-subscriptions', this.$el);
      this.fetchSubscriptions();
    },

    fetchSubscriptions: function() {
      $.getJSON('subscription')
      .done(function(feeds) {
        var $feeds = $('ul', this.$subscriptions);
        $.each(feeds, function(i, feed) {
          var $feed = _.template(sidebarFeedTpl, feed);
          $feeds.append($feed);
        }.bind(this));
        $('header .size', this.$subscriptions).text('(' + feeds.length + ')');
      }.bind(this));
    }
  });
});
