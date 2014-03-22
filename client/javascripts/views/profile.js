'use strict';

angular.module('ProfileModule', [])
.controller('ProfileCtrl', [
  '$scope', '$window', '$http', '$routeParams', 'userService', 'archiveService',
  function ($scope, $window, $http, $routeParams ,userService, archiveService) {
    if ($routeParams.error) {
      $scope.message = {clazz: 'alert-danger', text: $routeParams.error};
    } else if ($routeParams.info) {
      $scope.message = {clazz: 'alert-success', text: $routeParams.info};
    }
    userService.get().then(function(user) {
      $scope.user = user;
    });
    archiveService.getProviders().then(function(providers) {
      $scope.providers = providers;
    });

    $scope.userAsAccessTo = function(providerName) {
      var provider = $scope.user.providers[providerName];
      return provider && provider.access;
    };
  }
])
.filter('archiveRegistrationUrl', ['$location', function($location) {
  var realm = $location.protocol() + '://' + $location.host() + ($location.port() === 80 ? '' : ':' + $location.port());
  return function(provider) {
    return provider ? provider.url + '/oauth/authorize?response_type=code&client_id=' +
      provider.key + '&redirect_uri=' + realm + '/api/archive/' + provider.name + '/register' : null;
  };
}]);
