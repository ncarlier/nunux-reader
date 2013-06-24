'use strict';

angular.module('ReaderApp', ['SubscriptionModule', 'TimelineModule'])
.config(['$routeProvider', function($routeProvider) {
  $routeProvider
  .when('/timeline/:timeline', {
    templateUrl: 'views/timeline.html',
    controller: 'TimelineCtrl'
  })
  .otherwise({
    redirectTo: '/timeline/global'
  });
}])
.filter('fromNow', function() {
  return function(dateString) {
    return moment(new Date(dateString)).fromNow()
  };
});
