define([
       'jquery',
       'underscore',
       'backbone',
       'channel',
       'text!templates/sidebar.html',
       'text!templates/sidebar-subs.html'
], function($, _, Backbone, channel, sidebarTpl, sidebarSubsTpl){
  return Backbone.View.extend({
    className: 'slide',

    events: {
      //'click .btn-subs': 'toggleSubsciptions'
    },

    initialize: function () {
      channel.on('app.event.timelinesize', function (data) {
        $('.menu-all', this.$el).text('All items (' + data.total + ')');
      }.bind(this));
      channel.on('app.event.archivesize', function (data) {
        $('.menu-archive', this.$el).text('Saved items (' + data.total + ')');
      }.bind(this));
      channel.on('app.event.route', function (data) {
        $('li', this.$el).removeClass('active');
        $('.menu-' + data.route, this.$el).parent().addClass('active');
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
          var $feed = _.template(sidebarSubsTpl, feed);
          this.$nav.append($feed);
        }.bind(this));
      }.bind(this));
    }
  });
});
