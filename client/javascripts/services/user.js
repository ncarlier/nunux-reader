'use strict';

angular.module('UserService', [])
.factory('userService', [
  '$q', '$http', '$log',
  function ($q, $http, $log) {
    var url = '/api/user',
        user = null;

    var fetchUser = function() {
      var deferred = $q.defer();
      $http.get(url)
      .success(deferred.resolve)
      .error(deferred.reject);
      return deferred.promise;
    };

    var getUser = function() {
      var deferred = $q.defer();
      if (user) deferred.resolve(user);
      else {
        fetchUser()
        .then(function(_user) {
          $log.debug('User fetched: ' + _user.uid);
          user = _user;
          user.registrationDate = new Date(parseInt(_user.registrationDate));
          deferred.resolve(user);
        }, deferred.reject);
      }
      return deferred.promise;
    };

    var getUserProviders = function() {
      return getUser().then(function(user) {
        var providers = [];
        for (var key in user.providers) {
          if (user.providers[key].access) {
            providers.push(key);
          }
        }
        return providers;
      });
    };

    return {
      get: getUser,
      getProviders: getUserProviders
    };
  }
]);
