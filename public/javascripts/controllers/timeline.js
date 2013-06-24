'use strict';

angular.module('TimelineModule', [])
.controller('TimelineCtrl', function ($scope, $http, $routeParams) {
  $scope.order = 'ASC';
  $scope.isShowingAllItems = true;
  $scope.haveAllItems = true;
  $scope.isReadable = true;
  $scope.isEnding = true;
  $http.get('/timeline/' + $routeParams.timeline + '/status').success(function (data) {
    $scope.timeline = data;
  });
  $http.get('/timeline/' + $routeParams.timeline).success(function (data) {
    $scope.articles = data.articles;
  });
});

