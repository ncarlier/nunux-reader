'use strict';

angular.module('ManageModule', ['ngUpload'])
.controller('ManageCtrl', function ($scope, $rootScope, $http) {
  $scope.newFeedUrl = null;
  $rootScope.currentPage = 'manage';

  $scope.refresh = function() {
    $http.get('/subscription').success(function (data) {
      $scope.subscriptions = data;
    });
  }

  $scope.getStatusClass = function(status) {
    var result = 'inverse';
    if (status) {
      result = status.match(/^error/g) ? 'important' : 'success';
    }
    return result;
  }
  $scope.getStatusDesc = function(status) {
    var result = 'This feed had not yet been parsed.';
    if (status) {
      result = status.match(/^error/g) ? status : 'Feed successfully parsed';
    }
    return result;
  }
  $scope.getStatusLabel = function(status) {
    var result = 'Not updated';
    if (status) {
      result = status.match(/^error/g) ? 'In error' : status;
    }
    return result;
  }

  $scope.unSubscribe = function(feed) {
    if (confirm('Do you really want to unsubscribe from "' + feed.title + '" ?')) {
      $http.delete('/subscription/' + feed.id)
      .success(function(data) {
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
        $scope.message = {clazz: 'alert-error', text: 'Unable to remove Feed "' + feed.title + '"!'};
      });
    }
  }

  $scope.subscribe = function(url) {
    if (url) {
      $http.post('/subscription', {url: url})
      .success(function(feed) {
        $scope.message = {clazz: 'alert-success', text: 'Feed "' + feed.title + '" successfully added.'};
        $scope.subscriptions.push(feed);
        $scope.newFeedUrl = null;
        $rootScope.$broadcast('app.event.subscriptions.add', feed);
      })
      .error(function() {
        $scope.message = {clazz: 'alert-error', text: 'Unable to remove Feed "' + feed.title + '"!'};
      });
    }
  }

  $scope.uploadComplete = function (content, completed) {
    if (completed && content.length > 0) {
      var res = {};
      // TODO not very clean
      if (typeof content === 'string') {
        res.error = content.match(/<p>(.+)<\/p>/);
        res.error = res.error ? res.error[1] : 'Unknown';
      }
      if (res.error) {
        $scope.message = {clazz: 'alert-error', text: 'Unable to import file: ' + res.error};
      } else {
        $scope.message = {clazz: 'alert-success', text: content.length + ' subscription(s) successfully imported.'};
        $scope.refresh();
        $rootScope.$broadcast('app.event.subscriptions.refresh');
      }
    }
  }

  $scope.refresh();
});
