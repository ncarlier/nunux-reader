define(['backbone', 'models/feed'], function(Backbone, Feed){
  return Backbone.Collection.extend({
    model: Feed,
    url:  '/subscription',
    comparator: function(item) {
      return item.get('title').toLowerCase();
    }
  });
});

