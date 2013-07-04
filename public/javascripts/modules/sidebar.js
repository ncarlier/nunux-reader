'use strict';

angular.module('SidebarModule', [])
.controller('SidebarCtrl', function ($scope, $rootScope, $http) {
  $scope.refresh = function() {
    $http.get('/timeline').success(function (data) {
      $scope.timelines = data;
      $scope.globalSize = data[0].size;
      $scope.archiveSize = data[1].size;
    });
  };

  $scope.isSubscription = function(item) {
    return (item.feed);
  };

  $scope.$on('app.event.subscriptions.add', $scope.refresh);
  $scope.$on('app.event.subscriptions.remove', $scope.refresh);
  $scope.$on('app.event.subscriptions.refresh', $scope.refresh);

  $scope.$on('app.event.timeline.status', function(event, data) {
    if (data.timeline == 'global') {
      $scope.globalSize = data.size;
      if (data.size % 10 == 0) {
        $scope.refresh();
      }
    } else if (data.timeline == 'archive') {
      $scope.archiveSize = data.size;
    } else {
      for (var i=0 ; i < $scope.timelines.length ; i++) {
        if ($scope.timelines[i].timeline == data.timeline) {
          $scope.timelines[i].size = data.size;
          if (data.size % 10 == 0) {
            $scope.refresh();
          }
          break;
        }
      }
    }
  });

  $scope.refresh();
});
