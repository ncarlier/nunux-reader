'use strict';

angular.module('ArticleService', ['ArchiveService'])
.factory('articleService', [
  '$q', '$http', '$log', 'archiveService',
  function ($q, $http, $log, archiveProvider) {
    var url = '/api/timeline';

    var fetchArticles = function(timeline, next, order, show) {
      var params = $.param({
        next: next,
        order: order,
        show: show
      });

      var deferred = $q.defer();
      $http.get(url + '/' + timeline + '?' + params)
      .success(deferred.resolve)
      .error(deferred.reject);
      return deferred.promise;
    };

    var markAsRead = function(timeline, aid) {
      $log.debug('Marking article ' + aid + ' as read...');
      var deferred = $q.defer();
      $http.delete(url + '/' + timeline + '/' + aid)
      .success(function (data) {
        $log.debug('Article ' + aid + ' marked as read...');
        deferred.resolve(data);
      });
      .error(deferred.reject);

      return deferred.promise;;
    };

    var markAllAsRead = function(timeline) {
      $log.debug('Marking all articles of timeline ' + timeline + ' as read...');
      var deferred = $q.defer();
      $http.delete(url + '/' + timeline)
      .success(function (data) {
        $log.debug('All articles of timeline ' + timeline + ' marked as read.');
        deferred.resolve(data);
      });
      .error(deferred.reject);

      return deferred.promise;;
    };

    var keepUnRead = function(timeline, aid) {
      $log.debug('Marking article ' + aid + ' as unread...');
      var deferred = $q.defer();
      $http.put(url + '/' + timeline + '/' + aid)
      .success(function (data) {
        $log.debug('Article ' + aid + ' marked as unread...');
        deferred.resolve(data);
      });
      .error(deferred.reject);

      return deferred.promise;;
    };

    var saveArticle = function(article, provider) {
      $log.debug('Saving article ' + article.id + ' to ' + provider);
      return archiveService.get(provider).save(article);
    };

    var trashArticle = function(ref, provider) {
      $log.debug('Trashing article ' + ref + ' from ' + provider);
      return archiveService.get(provider).trash(article);
    };

    return {
      fetch: fetchArticles,
      markAsRead: markAsRead,
      markAllAsRead: markAllAsRead,
      keepUnRead:keepUnRead,
      save: saveArticle,
      trash: trashArticle
    };
  }
]);
