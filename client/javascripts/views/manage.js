'use strict';

angular.module('ManageModule', ['angularFileUpload'])
.controller('ManageCtrl', [
  '$rootScope', '$scope', '$http', '$upload',
  function ($rootScope, $scope, $http, $upload) {
    var apiUrl = '/api/subscription/';

    $scope.newFeedUrl = null;
    $scope.predicate = 'title';

    $scope.onFileSelect = function($files) {
      $scope.files = $files;
    };

    $scope.refresh = function() {
      $http.get(apiUrl).success(function (data) {
        $scope.subscriptions = data;
      });
    };

    $scope.unSubscribe = function(feed) {
      if (confirm('Do you really want to unsubscribe from "' + feed.title + '" ?')) {
        $http.delete(apiUrl + feed.id)
        .success(function() {
          $scope.message = {clazz: 'alert-success', text: 'Feed "' + feed.title + '" successfully removed.'};
          for (var i = 0; i < $scope.subscriptions.length; i++) {
            if ($scope.subscriptions[i].id == feed.id) {
              $scope.subscriptions.splice(i, 1);
              $scope.newFeedUrl = feed.xmlurl;
              $rootScope.$broadcast('app.event.subscriptions.remove', feed);
              break;
            }
          }
        })
        .error(function() {
          $scope.message = {clazz: 'alert-danger', text: 'Unable to remove Feed "' + feed.title + '"!'};
        });
      }
    };

    $scope.subscribe = function() {
      if (!this.urlForm.$valid) return;
      $http.post(apiUrl, {url: $scope.newFeedUrl})
      .success(function(feed) {
        $scope.message = {clazz: 'alert-success', text: 'Feed "' + feed.title + '" successfully added.'};
        $scope.subscriptions.push(feed);
        $scope.newFeedUrl = null;
        $rootScope.$broadcast('app.event.subscriptions.add', feed);
      })
      .error(function() {
        $scope.message = {clazz: 'alert-danger', text: 'Unable to subscribe to "' + $scope.newFeedUrl + '"!'};
      });
    };

    $scope.importOpml = function () {
      if (!this.fileForm.$valid || !$scope.files) return;
      $upload.upload({
        url: apiUrl,
        file: $scope.files[0]
      }).progress(function(evt) {
        $log.info('percent: ' + parseInt(100.0 * evt.loaded / evt.total));
      }).success(function(data, status, headers, config) {
        $scope.message = {clazz: 'alert-success', text: data.length + ' subscription(s) successfully imported.'};
        $scope.refresh();
        $rootScope.$broadcast('app.event.subscriptions.refresh');
      }).error(function(err) {
        $scope.message = {clazz: 'alert-danger', text: 'Unable to import file: ' + err};
      });
    };

    $scope.refresh();
  }
])
.filter('statusClass', function() {
  return function(feed) {
    var result = 'default';
    if (feed.status) {
      if (feed.status.match(/^error/g)) result = 'danger';
      else if (feed.pshbStatus == 'subscribe') result = 'primary';
      else result = 'success';
    }
    return result;
  };
})
.filter('statusDesc', function() {
  return function(feed) {
    var result = 'This feed had not yet been parsed.';
    if (feed.status) {
      if (feed.status.match(/^error/g)) result = feed.status;
      else if (feed.pshbStatus == 'subscribe') result = 'Feed subscribed to ' + feed.hub;
      else result = 'Feed successfully parsed';
    }
    return result;
  };
})
.filter('statusLabel', function() {
  return function(feed) {
    var result = 'Not updated';
    if (feed.status) {
      result = feed.status.match(/^error/g) ? 'In error' : feed.status;
    }
    return result;
  };
})
.filter('hubUrl', ['$window', function($window) {
  return function(feed) {
    var path = '/subscription-details?';
    var query = {
      'hub.callback': $window.location.origin + '/pubsubhubbud/callback',
      'hub.topic': feed.xmlurl
    };
    return feed.hub + path + $.param(query);
  };
}]);
