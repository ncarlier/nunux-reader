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
  $scope.$on('app.event.timeline.status', function(event, data) {
    if (data.timeline == 'global') {
      $scope.globalSize = data.size;
      // TODO update feed timeline size
    } else if (data.timeline == 'archive') {
      $scope.archiveSize = data.size;
    } else {
      for (var i=0 ; i < $scope.timelines.length ; i++) {
        if ($scope.timelines[i].timeline == data.timeline) {
          // TODO change this: get info in server response...
          var diff = $scope.timelines[i].size - data.size;
          $scope.timelines[i] = data;
          $scope.globalSize -= diff;
          break;
        }
      }
    }
  });
});
