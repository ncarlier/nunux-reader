define([
       'jquery',
       'underscore',
       'backbone',
       'moment',
       'text!templates/manage-feed.html'
], function($, _, Backbone, moment, tpl){
  return Backbone.View.extend({

    tagName: 'tr',

    template: _.template(tpl),

    events: {
      "click button.remove" : "unSubscribe",
    },

    initialize: function () {
      this.listenTo(this.model, 'destroy', this.remove);
    },

    render: function() {
      var obj = {
        statusLabel: 'Not updated',
        statusDesc: 'This feed had not yet been parsed.',
        statusClass: 'inverse',
        updatedFrom: moment(this.model.get('updateDate')).fromNow()
      };
      if (this.model.get('status')) {
        var parts = this.model.get('status').split(':');
        if (parts[0] == 'error') {
          obj.statusClass = 'important';
          obj.statusLabel = 'In error';
          obj.statusDesc = this.model.get('status');
        } else {
          obj.statusClass = 'success';
          obj.statusLabel = this.model.get('status');
          obj.statusDesc = '';
        }
      }

      this.$el.attr('id', this.model.get('id'));
      this.$el.html(this.template(_.extend(obj, this.model.toJSON())));
      return this;
    },

    unSubscribe: function() {
      if (confirm('Do you really want to unsubscribe to "' + this.model.get('title') + '" feed ?')) {
        this.model.destroy();
      }
    }
  });
});
