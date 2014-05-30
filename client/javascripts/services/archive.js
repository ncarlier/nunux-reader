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

    var getProvider = function(providerName) {
      return getProviders().then(function(_providers) {
        for (var i in _providers) {
          var provider = _providers[i];
          if (provider.name === providerName) {
            return provider;
          }
        }
        return null;
      });
    };

    var saveArticle = function(article, providerName) {
      var deferred = $q.defer();
      $http.post(url + '/' + providerName + '/' + article.id)
      .success(deferred.resolve)
      .error(deferred.reject);
      return deferred.promise;
    };

    var removeArticle = function(article, providerName) {
      var deferred = $q.defer();
      $http.delete(url + '/' + providerName + '/' + article.id)
      .success(deferred.resolve)
      .error(deferred.reject);
      return deferred.promise;
    };

    return {
      getProviders: getProviders,
      getProvider: getProvider,
      save: saveArticle,
      remove: removeArticle
    };
  }
]);
