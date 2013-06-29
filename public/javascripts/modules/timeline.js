'use strict';

angular.module('TimelineModule', [])
.controller('TimelineCtrl', function ($scope, $http, $routeParams) {
  $scope.timeline = $routeParams.timeline;
  $scope.url = '/timeline/' + $scope.timeline;
  $scope.order = 'ASC';
  $scope.isShowingAllItems = false;
  $scope.haveAllItems = $scope.timeline != 'global' && $scope.timeline != 'archive';
  $scope.isReadable = function() {
    return !$scope.isShowingAllItems;
  };
  $scope.isEnding = false;
  $scope.articles = [];
  $http.get($scope.url + '/status').success(function (data) {
    $scope.timeline = data;
  });
  $scope.onClickShow = function() {
    $scope.isShowingAllItems = !$scope.isShowingAllItems;
    $scope.articles = [];
    $scope.next = null;
    $scope.fetchTimeline();
  };
  $scope.onClickSort = function() {
    $scope.order = ($scope.order == 'ASC') ? 'DESC' : 'ASC';
    $scope.articles = [];
    $scope.next = null;
    $scope.fetchTimeline();
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
    $http.get(url).success(function (data) {
      for (var i = 0; i < data.articles.length; i++) {
        $scope.articles.push(data.articles[i]);
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
      var checkWhenEnabled, handler, scrollDistance, scrollEnabled;
      $window = angular.element($window);
      scrollDistance = 0;
      if (attrs.timelineScrollDistance != null) {
        scope.$watch(attrs.timelineScrollDistance, function(value) {
          return scrollDistance = parseInt(value, 10);
        });
      }
      scrollEnabled = true;
      checkWhenEnabled = false;
      if (attrs.timelineScrollDisabled != null) {
        scope.$watch(attrs.timelineScrollDisabled, function(value) {
          scrollEnabled = !value;
          if (scrollEnabled && checkWhenEnabled) {
            checkWhenEnabled = false;
            return handler();
          }
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
            return scope.$eval(attrs.timeline);
          } else {
            return scope.$apply(attrs.timeline);
          }
        } else if (shouldFetch) {
          return checkWhenEnabled = true;
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
.directive('timelineArticle', function () {
  return {
    link: function (scope, elem, attrs) {
      // watch the expression, and update the UI on change.
      var baseUrl = scope.article.meta.link;
      scope.$watch(attrs.timelineArticle, function(value) {
        elem.html(value);
        $('script', elem).filter('script[src^="http://feeds.feedburner.com"]').remove();
        $('a', elem).each(function() {
          $(this).attr('target', '_blank');
          var href = $(this).attr('href');
          if(href && !href.match(/^\s*http/g)) {
            $(this).attr('href', baseUrl + '/' + href);
          }
        });
        $('img', elem).each(function() {
          var src = $(this).attr('src');
          if(!src.match(/^\s*http/g)) {
            $(this).attr('src', baseUrl + '/' + src);
          }
        });
      });
    }
  }
});

