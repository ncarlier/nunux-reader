define([
       'jquery',
       'underscore',
       'backbone',
       'text!templates/subscribe.html'
], function($, _, Backbone, subscribeTpl){
  return Backbone.View.extend({

    tagName: 'section',

    events: {
      //'click .btn-subs': 'toggleSubsciptions'
    },

    render: function() {
      this.$el.html(_.template(subscribeTpl, {}));
    }
  });
});
