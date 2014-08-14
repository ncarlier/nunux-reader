'use strict';

angular.module('SidebarModule', [])
.directive('appSidebar', ['$location', function($location) {
  return {
    restrict: 'E',
    templateUrl: 'templates/components/sidebar.html',
    controller: 'SidebarCtrl',
    link: function postLink(scope, element, attrs, controller) {
      scope.$watch(function() {
        return $location.url();
      }, function(newValue, oldValue) {
        var target = newValue.replace(/^\//g, '#');
        $('a.list-group-item', element).each(function(k, a) {
          var $a = angular.element(a),
            href = $a.attr('href'),
            pattern, regexp;

          if (href) {
            if(target === href) {
              $a.addClass('active');
            } else {
              $a.removeClass('active');
            }
          }
        });
      });
    }
  };
}])
.controller('SidebarCtrl', [
  '$window', '$rootScope', '$scope', '$http', '$location', '$modal', '$log', 'userService',
  function ($window, $rootScope, $scope, $http, $location, $modal, $log, userService) {
    userService.get().then(function(user) {
      $scope.user = user;
    });

    $scope.order = '-size';

    $rootScope.toggleMenu = function() {
      $rootScope.mainMenuStatus = $rootScope.mainMenuStatus === 'open' ? '' : 'open';
    };

    var refresh = function() {
      $http.get('/api/timeline').success(function (data) {
        $scope.timelines = data;
        $scope.globalSize = data[0].size;
      });
    };

    $scope.isSubscription = function(item) {
      return (item.feed);
    };

    $scope.$on('app.event.subscriptions.add', refresh);
    $scope.$on('app.event.subscriptions.remove', refresh);
    $scope.$on('app.event.subscriptions.refresh', refresh);

    $scope.$on('app.event.timeline.status', function(event, data) {
      if (data.timeline == 'global') {
        $scope.globalSize = data.size;
        if (data.size === 0) {
          for (var i = 0 ; i < $scope.timelines.length ; i++) {
            $scope.timelines[i].size = 0;
          }
        }
      } else {
        for (var i = 0 ; i < $scope.timelines.length ; i++) {
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
    Mousetrap.bind(['g a'], function() {
      $scope.$apply(function() {
        $location.url('/');
      });
    });
    Mousetrap.bind(['g f'], function() {
      $scope.$apply(function() {
        $location.url('/manage');
      });
    });
    Mousetrap.bind(['?'], function() {
      $scope.$apply(function() {
        $modal.open({
          templateUrl: 'templates/dialog/keybindings.html',
          controller: 'KeybindingsModalCtrl'
        });
      });
    });

    refresh();
  }
])
.controller('KeybindingsModalCtrl', [
  '$scope', '$modalInstance', function ($scope, $modalInstance) {
    $scope.ok = $modalInstance.close;
  }
]);
