define([
       'jquery',
       'underscore',
       'backbone',
       'channel',
       'text!templates/aside.html',
       'text!templates/subscription.html'
], function($, _, Backbone, channel, asideTpl, subscriptionTpl){
  return Backbone.View.extend({

    tagName: 'aside',

    events: {
      //'click .btn-subs': 'toggleSubsciptions'
    },

    initialize: function () {
      channel.on('app.event.timelinesize', function (data) {
        $('.menu.all', this.$el).text('All items (' + data.total + ')');
      }.bind(this));
    },

    render: function() {
      this.$aside = _.template(asideTpl, {});
      this.$el.html(this.$aside);
      this.$subscriptions = $('.subscriptions', this.$el);
      this.fetchSubscriptions();
    },

    toggleSubscriptions: function() {
      var $icon = $(this).find('i');
      if ($icon.hasClass('icon-dropdown-open')) {
        $icon.removeClass('icon-dropdown-open').addClass('icon-dropdown-close');
        $subscriptions.hide();
      } else {
        $icon.removeClass('icon-dropdown-close').addClass('icon-dropdown-open');
        $subscriptions.show();
      }
      return false;
    },

    fetchSubscriptions: function() {
      $.getJSON('subscription')
      .done(function(feeds) {
        $.each(feeds, function(i, feed) {
          var $feed = _.template(subscriptionTpl, feed);
          this.$subscriptions.append($feed);
        }.bind(this));
      }.bind(this));
    }
  });
});
