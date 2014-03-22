'use strict';

angular.module('ArchiveService', [])
.factory('archiveService', [
  '$q', '$http', '$log',
  function ($q, $http, $log) {
    var url = '/api/archive',
        providers = null;

    var fetchProviders = function() {
      var deferred = $q.defer();
      $http.get(url)
      .success(deferred.resolve)
      .error(deferred.reject);
      return deferred.promise;
    };

    var getProviders = function() {
      var deferred = $q.defer();
      if (providers) deferred.resolve(providers);
      else {
        fetchProviders()
        .then(function(_providers) {
          $log.debug('Providers fetched: ' + _providers.length);
          providers = _providers;
          deferred.resolve(providers);
        }, deferred.reject);
      }
      return deferred.promise;
    };

    var saveArticle = function(article) {
      return getProviders().then(function(_providers) {
        var defaultProvider = _providers[0];
        var deferred = $q.defer();
        $http.post(url + '/' + defaultProvider.name + '/' + article.id)
        .success(deferred.resolve)
        .error(deferred.reject);
        return deferred.promise;
      });
    };

    var removeArticle = function(article) {
      return getProviders().then(function(_providers) {
        var defaultProvider = _providers[0];
        var deferred = $q.defer();
        $http.delete(url + '/' + defaultProvider.name + '/' + article.id)
        .success(deferred.resolve)
        .error(deferred.reject);
        return deferred.promise;
      });
    };

    return {
      getProviders: getProviders,
      save: saveArticle,
      remove: removeArticle
    };
  }
]);
