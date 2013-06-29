'use strict';

angular.module('SidebarModule', [])
.controller('SidebarCtrl', function ($scope, $http) {
  $http.get('/timeline').success(function (data) {
    $scope.timelines = data;
    $scope.globalSize = data[0].size;
    $scope.archiveSize = data[1].size;
  });
  $scope.isSubscription = function(item) {
    return (item.feed);
  };
});
