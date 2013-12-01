'use strict';

angular.module('SidebarModule', [])
.controller('SidebarCtrl', function ($scope, $rootScope, $http, $location, $dialog) {
  $scope.order = '-size';
  $scope.refresh = function() {
    $http.get('/api/timeline').success(function (data) {
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
    } else if (data.timeline == 'archive') {
      $scope.archiveSize = data.size;
    } else {
      for (var i=0 ; i < $scope.timelines.length ; i++) {
        if ($scope.timelines[i].timeline == data.timeline) {
          $scope.timelines[i].size = data.size;
          break;
        }
      }
    }
  });

  $scope.switchOrder = function() {
    $scope.order = $scope.order == '-size' ? 'feed.title' : '-size';
  };

  // Key bindings...
  Mousetrap.bind(['g h'], function() {
    $scope.$apply(function() {
      $location.url('/');
    });
  });
  Mousetrap.bind(['g a'], function() {
    $scope.$apply(function() {
      $location.url('/timeline/archive');
    });
  });
  Mousetrap.bind(['g u'], function() {
    $scope.$apply(function() {
      $location.url('/manage');
    });
  });
  Mousetrap.bind(['?'], function() {
    $scope.$apply(function() {
      $dialog('/views/keybindings.html', {
        id: 'keyBindingsDialog',
        title: 'Keyboard shortcuts',
        backdrop: true,
        footerTemplate: '<button class="btn btn-primary" ng-click="$modalSuccess()">{{$modalSuccessLabel}}</button>',
        success: {label: 'ok', fn: function() {}}
      });
    });
  });

  $scope.showProfile = function() {
    $dialog('/views/profile.html', {
      id: 'userProfileDialog',
      title: 'My profile',
      backdrop: true,
      footerTemplate: '<button class="btn btn-primary" ng-click="$modalSuccess()">{{$modalSuccessLabel}}</button>',
      success: {label: 'ok', fn: function() {}}
    });
  };

  $scope.refresh();
});
