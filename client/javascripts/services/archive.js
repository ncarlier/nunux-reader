'use strict';

angular.module('ArchiveService', [])
.factory('archiveService', [
  '$q', '$http', '$log'
  function ($q, $http, $log) {
    var keeperUrl = 'http://localhost:3000/api/document';

    var keeperProvider = {
      save: function(article) {
        $log.debug('Saving article ' + article.id + ' in keeper...');
        var params = $.param({
          title: article.title
        });

        var deferred = $q.defer();
        $http.post(keeperUrl + '?' + params, article.content)
        .success(function(data) {
          deferred.resolve(data);
        })
        .error(deferred.reject);

        return deferred.promise;;
      },
      trash: function(ref) {
        $log.debug('Trashing article ' + ref + ' in keeper...');
        var deferred = $q.defer();
        $http.delete(keeperUrl)
        .success(function(data) {
          deferred.resolve(data);
        })
        .error(deferred.reject);

        return deferred.promise;;
      },

    };

    return {
      get: function(provider) {
        if (provider === 'keeper') {
          return keeperProvider;
        } else {
          throw new Error('Provider not found.');
        }
      }
    };
  }
]);
