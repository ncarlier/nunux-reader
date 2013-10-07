'use strict';

angular.module('TimelineModule', ['ui.qrcode'])
.controller('TimelineCtrl', function ($scope, $http, $routeParams, $rootScope) {
  $scope.timelineName = $routeParams.timeline;
  $rootScope.currentPage = $routeParams.timeline;
  $scope.url = '/timeline/' + $scope.timelineName;
  $scope.order = $scope.timelineName == 'archive' ? 'DESC' : 'ASC';
  $scope.isShowingAllItems = false;
  $scope.haveAllItems = $scope.timelineName != 'global' && $scope.timelineName != 'archive';
  $scope.isReadable = function() {
    return !$scope.isShowingAllItems && $scope.timelineName != 'archive';
  };
  $scope.isEnding = false;
  $scope.articles = [];

  $scope.getArticle = function(aid) {
    for (var i = 0; i < $scope.articles.length; i++) {
      if ($scope.articles[i].id == aid) {
        return $scope.articles[i];
      }
    }
  };

  $scope.updateArticle = function(aid, data) {
    angular.extend($scope.getArticle(aid), data);
  };

  $http.get($scope.url + '/status').success(function (data) {
    $scope.timeline = data;
    $rootScope.$broadcast('app.event.timeline.status', data);
  });

  $scope.refresh = function() {
    $scope.articles = [];
    $scope.next = null;
    $scope.fetchTimeline();
  };

  $scope.toggleShow = function() {
    $scope.isShowingAllItems = !$scope.isShowingAllItems;
    //$scope.order = $scope.isShowingAllItems ? 'DESC' : 'ASC';
    $scope.refresh();
  };

  $scope.toggleSort = function() {
    $scope.order = ($scope.order == 'ASC') ? 'DESC' : 'ASC';
    $scope.refresh();
  };

  $scope.markAllAsRead = function() {
    if (confirm('Do you really want to mark all items as read ?')) {
      $http.delete($scope.url).success(function (data) {
        $scope.timeline = data;
        $scope.articles = [];
        $scope.isEnding = true;
        $scope.next = null;
        $rootScope.$broadcast('app.event.timeline.status', data);
      });
    }
  };

  $scope.autoMarkAsRead = function(aid) {
    var article = $scope.getArticle(aid);
    if (article && !article.read && !article.keepUnRead && !article.reading) {
      article.reading = true;
      $scope.markAsRead(aid);
    }
  };

  $scope.markAsRead = function(aid) {
    $http.delete($scope.url + '/' + aid).success(function (data) {
      $scope.timeline = data;
      $rootScope.$broadcast('app.event.timeline.status', data);
      $scope.updateArticle(aid, {read: true, keepUnRead: false});
    });
  };

  $scope.keepUnRead = function(aid) {
    $http.put($scope.url + '/' + aid).success(function (data) {
      $scope.timeline = data;
      $rootScope.$broadcast('app.event.timeline.status', data);
      $scope.updateArticle(aid, {read: false, keepUnRead: true});
    });
  };

  $scope.saveArticle = function(aid) {
    var url = '/timeline/archive/' + aid;
    $http.put(url).success(function(data) {
      $rootScope.$broadcast('app.event.timeline.status', data);
      humane.log('Article saved.');
      $scope.updateArticle(aid, {saved: true});
    });
  };

  $scope.trashArticle = function(aid) {
    var url = '/timeline/archive/' + aid;
    $http.delete(url).success(function(data) {
      $rootScope.$broadcast('app.event.timeline.status', data);
      humane.log('Article trashed.');
      $scope.updateArticle(aid, {saved: false});
    });
  };

  $scope.fetchTimeline = function() {
    if ($scope.busy) return;
    $scope.busy = true;
    var params = $.param({
      next: $scope.next,
      order: $scope.order,
      show: $scope.isShowingAllItems ? 'all' : 'new'
    });
    var url = $scope.url + '?' + params;
    $http.get(url).success(function(data) {
      for (var i = 0; i < data.articles.length; i++) {
        var article = data.articles[i];
        article.fold = false;
        article.keepUnRead = false;
        article.read = false;
        article.reading = false;
        article.saved = $scope.timelineName == 'archive';
        $scope.articles.push(article);
      }
      $scope.next = data.next;
      $scope.isEnding = !data.next;
      $scope.busy = false;
    });
  };
})
.directive('timeline', ['$rootScope', '$window', '$timeout',
           function($rootScope, $window, $timeout) {
  return {
    link: function(scope, elem, attrs) {
      var checkWhenEnabled, handler, scrollDistance, scrollEnabled, readEnabled, readHandler;
      $window = angular.element($window);
      scrollDistance = 0;
      if (attrs.timelineScrollDistance !== null) {
        scope.$watch(attrs.timelineScrollDistance, function(value) {
          scrollDistance = parseInt(value, 10);
          return scrollDistance;
        });
      }
      scrollEnabled = true;
      checkWhenEnabled = false;
      if (attrs.timelineScrollDisabled !== null) {
        scope.$watch(attrs.timelineScrollDisabled, function(value) {
          scrollEnabled = !value;
          if (scrollEnabled && checkWhenEnabled) {
            checkWhenEnabled = false;
            return handler();
          }
        });
      }

      readEnabled = false;
      if (attrs.timelineReadEnabled !== null) {
        scope.$watch(attrs.timelineReadEnabled, function(value) {
          readEnabled = value;
          return readEnabled;
        });
      }

      handler = function(event) {
        var shouldFetch = false;
        if (event){
          var $target = $(event.target);
          if (event.target == document) {
            shouldFetch = $target.scrollTop() + $window.height() + scrollDistance >= $target.height();
          } else {
            shouldFetch = $target.scrollTop() + $target.innerHeight() + scrollDistance >= $target[0].scrollHeight;
          }
        } else {
          shouldFetch = true;
        }
        if (shouldFetch && scrollEnabled) {
          if ($rootScope.$$phase) {
            scope.$eval(attrs.timeline);
          } else {
            scope.$apply(attrs.timeline);
          }
        } else if (shouldFetch) {
          checkWhenEnabled = true;
        }
        if (readEnabled && event) {
          var areaTop = event.target == document ? $(document).scrollTop() : 
            $(event.target).offset().top;
          $('article.not-seen', $(event.target)).each(function() {
            if ($(this).offset().top < areaTop) {
              var aid = $(this).attr('id');
              var tlReadHandle = scope.$eval(attrs.timelineReadHandle);
              tlReadHandle(aid);
            }
          });
        }
      };

      $(document).on('scroll', handler);
      $(elem).on('scroll', handler);
      scope.$on('$destroy', function() {
        return $(document).off('scroll', handler) && $(elem).off('scroll', handler);
      });
      return $timeout((function() {
        if (attrs.timelineImmediateCheck) {
          if (scope.$eval(attrs.timelineImmediateCheck)) {
            return handler();
          }
        } else {
          return handler();
        }
      }), 0);
    }
  };
}
])
.directive('timelineArticle', ['$compile', function ($compile) {
  return {
    link: function ($scope, $elem, attrs) {
      // watch the expression, and update the UI on change.
      var pathArray = $scope.article.link.split( '/' );
      var baseUrl = pathArray[0] + '//' + pathArray[2];
      $scope.$watch(attrs.timelineArticle, function(value) {
        var $content = $('<div>').html(value);
        $('script', $content).filter('script[src^="http://feeds.feedburner.com"]').remove();
        $('a', $content).each(function() {
          $(this).attr('target', '_blank');
          var href = $(this).attr('href');
          if(href && !href.match(/^\s*http/g)) {
            $(this).attr('href', baseUrl + '/' + href);
          }
        });
        $('img', $content).each(function() {
          var src = $(this).attr('data-src');
          if (src) {
            if(!src.match(/^\s*http/g)) {
              src = baseUrl + '/' + src;
            }
            $(this).attr('bn-lazy-load', src);
            $(this).removeAttr('data-src');
          }
        });
        $elem.html($compile($('<div>').append($content).html())($scope));
      });
    }
  };
}]);

