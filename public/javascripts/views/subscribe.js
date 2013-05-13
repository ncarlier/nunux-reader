define([
       'jquery',
       'underscore',
       'backbone',
       'text!templates/subscribe.html'
], function($, _, Backbone, tpl){
  return Backbone.View.extend({

    tagName: 'section',

    render: function() {
      this.$el.html(_.template(tpl, {}));
    }

  });
});
