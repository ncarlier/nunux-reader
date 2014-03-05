'use strict';

angular.module('ArchiveProvider', [])
.factory('archiveProvider', [
  '$q', '$http', '$log', '$window',
  function($q, $http, $log, $window) {
    var config = $window.user.configuration;

    var KeeperProvider = function(config) {
      this.url = config.provider.url + '/api/document';
      this.token = config.provider.token;
    };
    KeeperProvider.prototype.save = function(article) {
      $log.debug('Saving article ' + article.id + ' in keeper...');
      var deferred = $q.defer();
      $http.post(this.url, article.description, {
        params: {title: article.title, link: article.link},
        headers: {
          'Content-Type': 'text/html',
          'X-Auth-Token' : this.token
        }
      })
      .success(function(data) {
        data.ref = data._id;
        deferred.resolve(data);
      })
      .error(deferred.reject);
      return deferred.promise;
    };
    KeeperProvider.prototype.remove = function(article) {
      $log.debug('Removing article ' + article.archRef + ' from keeper...');
      var deferred = $q.defer();
      $http.delete(this.url + '/' + article.archRef, {
        headers: {
          'X-Auth-Token' : this.token
        }
      })
      .success(function(data) {
        deferred.resolve(data);
      })
      .error(deferred.reject);
      return deferred.promise;
    };

    return {
      get: function() {
        if (config.provider.type === 'keeper') {
          return new KeeperProvider(config);
        } else {
          throw new Error('Provider not found.');
        }
      }
    };
  }
]);
