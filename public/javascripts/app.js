'use strict';

angular.module('ReaderApp', ['SidebarModule', 'TimelineModule', 'ManageModule'])
.config(['$routeProvider', function($routeProvider) {
  $routeProvider
  .when('/timeline/:timeline', {
    templateUrl: 'views/timeline.html',
    controller: 'TimelineCtrl'
  })
  .when('/manage', {
    templateUrl: 'views/manage.html',
    controller: 'ManageCtrl'
  })
  .otherwise({
    redirectTo: '/timeline/global'
  });
}])
.filter('fromNow', function() {
  return function(dateString) {
    return moment(new Date(dateString)).fromNow()
  };
})
.filter('escape', function() {
  return window.encodeURIComponent;
})
.filter('prefix', function() {
  return function(input, prefix) {
    return input ? prefix + ' ' + input : '';
  };
});
