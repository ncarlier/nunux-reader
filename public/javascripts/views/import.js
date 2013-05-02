define([
       'jquery',
       'underscore',
       'backbone',
       'text!templates/import.html'
], function($, _, Backbone, importTpl){
  return Backbone.View.extend({

    tagName: 'section',

    events: {
      //'click .btn-subs': 'toggleSubsciptions'
    },

    render: function() {
      this.$el.html(_.template(importTpl, {}));
    }
  });
});
