'use strict';

angular.module('ProfileModule', [])
.controller('ProfileCtrl', [
  '$scope', '$window', '$http',
  function ($scope, $window, $http) {
    $scope.user = $window.user;
    $scope.date = new Date(parseInt($scope.user.registrationDate));

    $scope.configuration = $window.user.configuration;
    $scope.configure = function() {
      if (!this.configForm.$valid) return;
      $http.put('/api/user/' + $scope.user.uid + '/config', $scope.configuration)
      .success(function(config) {
        $scope.configuration = config;
        $window.user.config = config;
        $scope.message = {clazz: 'alert-success', text: 'Configuration saved.'};
      })
      .error(function() {
        $scope.message = {clazz: 'alert-danger', text: 'Unable to save configuration !'};
      });
    };
  }
]);
