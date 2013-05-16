define([
       'jquery',
       'underscore',
       'backbone',
       'text!templates/manage.html',
       'models/feed',
       'collections/feeds',
       'views/manage-feed'
], function($, _, Backbone, tpl, Feed, Feeds, FeedView){
  return Backbone.View.extend({

    tagName: 'section',

    className: 'slide',

    template: _.template(tpl),

    events: {
      "submit" : "submit",
    },

    initialize: function () {
      this.collection = new Feeds();
      this.listenTo(this.collection, 'add', this.addOne);
      this.collection.fetch();
    },

    render: function() {
      this.$el.html(this.template());
      return this;
    },

    addOne: function(feed) {
      var view = new FeedView({model: feed});
      $('.no-subs', this.$el).hide();
      $('.feed-list', this.$el).append(view.render().el);
    },

    submit: function(event) {
      var $form = event.target;
      var url = $('input[name=url]', event.target).val();
      if (url) {
        event.preventDefault();
        var newFeed = new Feed();
        newFeed.save({url: url}, {
          success: function(model, res) {
            var selector = '#' + model.id;
            selector = selector.replace(':', '\\:');
            if ($(selector, this.$el).length <= 0) {
              this.addOne(model);
              this.alert('success', 'Feed "' + model.get('title') + '" successfully added.');
            } else {
              this.alert('info', 'Feed "' + model.get('title') + '" is already subscribed.');
            }
          }.bind(this),
          error: function(model, xhr) {
            if (xhr.responseJSON && xhr.responseJSON.error) this.alert('error', xhr.responseJSON.error);
            else this.alert('error', xhr.responseText);
          }.bind(this)
        });
        return false;
      }
    },

    alert: function(type, msg) {
      $('.alert', this.$el).
        removeClass('alert-info alert-success alert-error').
        addClass('alert-' + type).text(msg).show();
    }
  });
});
