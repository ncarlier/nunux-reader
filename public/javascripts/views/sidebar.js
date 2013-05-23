define([
       'jquery',
       'underscore',
       'backbone',
       'channel',
       'text!templates/sidebar.html',
       'text!templates/sidebar-feed.html'
], function($, _, Backbone, channel, sidebarTpl, sidebarFeedTpl){
  return Backbone.View.extend({
    className: 'slide',

    events: {
      //'click .btn-subs': 'toggleSubsciptions'
    },

    initialize: function () {
      channel.on('app.event.timelinesize', function (data) {
        var selector = '.menu-' + data.timeline + '-timeline .size'
        selector = selector.replace(':', '\\:');
        $(selector, this.$el).text('(' + data.total + ')').parent().toggleClass('bold', data.total > 0);
      }.bind(this));
      channel.on('app.event.timelinechange', function (data) {
        var selector = '.menu-' + data.timeline + '-timeline';
        selector = selector.replace(':', '\\:');
        $('li', this.$el).removeClass('active');
        $(selector, this.$el).parent().addClass('active');
      }.bind(this));
    },

    render: function() {
      var $sidebar = _.template(sidebarTpl, {});
      this.$el.html($sidebar);
      this.$nav = $('.nav', this.$el);
      this.fetchSubscriptions();
    },

    fetchSubscriptions: function() {
      $.getJSON('subscription')
      .done(function(feeds) {
        $.each(feeds, function(i, feed) {
          var $feed = _.template(sidebarFeedTpl, feed);
          this.$nav.append($feed);
        }.bind(this));
        $('.subscriptions .size', this.$el).text('(' + feeds.length + ')');
      }.bind(this));
    }
  });
});
