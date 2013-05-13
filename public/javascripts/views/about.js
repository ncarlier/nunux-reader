define([
       'jquery',
       'underscore',
       'backbone',
       'text!templates/about.html'
], function($, _, Backbone, tpl){
  return Backbone.View.extend({

    tagName: 'section',

    className: 'about',

    render: function() {
      this.$el.html(_.template(tpl, {}));
    }
  });
});
