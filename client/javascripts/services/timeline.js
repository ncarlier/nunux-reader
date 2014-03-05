'use strict';

angular.module('TimelineService', [])
.factory('timelineService', [
  '$q', '$http', '$log',
  function ($q, $http, $log) {
    var url = '/api/timeline';

    var fetchTimeline = function(timeline, next, order, show) {
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

    var getTimelineStatus = function(timeline) {
      var deferred = $q.defer();
      $http.get(url + '/' + timeline + '/status')
      .success(deferred.resolve)
      .error(deferred.reject);
      return deferred.promise;
    };

    var markAsRead = function(timeline, aid) {
      $log.debug('Marking article ' + aid + ' as read...');
      var deferred = $q.defer();
      $http.delete(url + '/' + timeline + '/' + aid)
      .success(function (data) {
        $log.debug('Article ' + aid + ' marked as read.');
        deferred.resolve(data);
      })
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
      })
      .error(deferred.reject);

      return deferred.promise;;
    };

    var keepUnRead = function(timeline, aid) {
      $log.debug('Marking article ' + aid + ' as unread...');
      var deferred = $q.defer();
      $http.put(url + '/' + timeline + '/' + aid)
      .success(function (data) {
        $log.debug('Article ' + aid + ' marked as unread.');
        deferred.resolve(data);
      })
      .error(deferred.reject);

      return deferred.promise;;
    };

    return {
      fetch: fetchTimeline,
      status: getTimelineStatus,
      markAsRead: markAsRead,
      markAllAsRead: markAllAsRead,
      keepUnRead: keepUnRead
    };
  }
]);
