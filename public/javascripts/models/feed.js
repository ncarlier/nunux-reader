define(['backbone'], function(Backbone) {
  return Backbone.Model.extend({
    urlRoot: '/subscription',
    defaults: {
      id: null,
      url: null
    },

    validation: {
      url: {
        required: true,
        msg: 'URL is mandatory'
      }
    }
  });
});
