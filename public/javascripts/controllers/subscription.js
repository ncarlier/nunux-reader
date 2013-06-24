'use strict';

angular.module('SubscriptionModule', [])
.controller('SubscriptionCtrl', function ($scope, $http) {
  $http.get('/subscription').success(function (data) {
    $scope.subscriptions = data;
  });
});
