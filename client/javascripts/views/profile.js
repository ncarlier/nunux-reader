'use strict';

angular.module('ProfileModule', [])
.controller('ProfileCtrl', [
  '$scope', '$window',
  function ($scope, $window) {
    $scope.user = $window.user;
    $scope.date = new Date(parseInt($scope.user.registrationDate));
  }
]);
