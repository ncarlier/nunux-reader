'use strict';

angular.module('TimelineModule', ['angular-carousel', 'ui.qrcode', 'ui.lazy'])
.controller('TimelineCtrl', [
  '$rootScope', '$scope', '$http', '$q', '$timeout', '$routeParams', '$lazy',
  function ($rootScope, $scope, $http, $q, $timeout, $routeParams, $lazy) {
    var initializing = true;

    $scope.timelineName = $routeParams.timeline;
    $scope.url = '/api/timeline/' + $scope.timelineName;
    $scope.order = $scope.timelineName == 'archive' ? 'DESC' : 'ASC';
    $scope.show = 'new';
    $scope.isReadable = function() {
      return $scope.show == 'new' && $scope.timelineName != 'archive';
    };
    $scope.isEnded = false;
    $scope.articles = [];
    $scope.next = null;
    $scope.articleIndex = 0;

    $scope.getCurrent = function() {
      return $scope.articles.length > 0 ? $scope.articles[$scope.articleIndex] : null;
    };

    $scope.fetchStatus = function() {
      $http.get($scope.url + '/status').success(function (data) {
        $scope.timeline = data;
      });
    };

    $scope.fetchStatus();

    $scope.refresh = function() {
      $scope.articles = [];
      $scope.next = null;
      $scope.isEnded = false;
      $scope.fetch($scope.fetchStatus);
    };

    $scope.fetch = function(callback) {
      if ($scope.busy || $scope.isEnded) return;
      console.log('Fetching articles...');
      $scope.busy = true;
      var params = $.param({
        next: $scope.next,
        order: $scope.order,
        show: $scope.show
      });
      var url = $scope.url + '?' + params;
      initializing = false;
      $http.get(url).success(function(data) {
        $scope.isEnded = !data.next;
        if ($scope.isEnded) {
          var end = {
            fake: true,
            link: 'foo/bar',
            description: '<h1>You reach ground 0</h1>'
          };
          data.articles.push(end);
        }
        //$scope.articles = [];
        for (var i = 0; i < data.articles.length; i++) {
          var article = data.articles[i];
          article.keepUnRead = false;
          article.read = false;
          article.reading = false;
          article.saved = $scope.timelineName == 'archive';
          $scope.articles.push(article);
        }
        $scope.next = data.next;
        $scope.busy = false;
        $rootScope.$broadcast('app.event.subscriptions.refresh');
        if (callback) callback();
      });
    };

    $scope.markAllAsRead = function() {
      if ($scope.isReadable() && confirm('Do you really want to mark all items as read ?')) {
        console.log('Marking all articles as read...');
        $http.delete($scope.url).success(function (data) {
          $scope.timeline = data;
          $scope.articles = [];
          $scope.isEnded = true;
          $scope.next = null;
          $rootScope.$broadcast('app.event.timeline.status', data);
        });
      }
    };

    $scope.markAsRead = function(article) {
      if ($scope.isReadable()) {
        console.log('Marking article ' + article.id + ' as read...');
        $http.delete($scope.url + '/' + article.id).success(function (data) {
          $scope.timeline = data;
          $rootScope.$broadcast('app.event.timeline.status', data);
          article.read = true;
          article.keepUnRead = false;
        });
      }
    };

    $scope.keepUnRead = function(article) {
      if ($scope.isReadable()) {
        console.log('Marking article ' + article.id + ' as unread...');
        $http.put($scope.url + '/' + article.id).success(function (data) {
          $scope.timeline = data;
          $rootScope.$broadcast('app.event.timeline.status', data);
          article.read = false;
          article.keepUnRead = true;
        });
      }
    };

    $scope.saveArticle = function(article) {
      var url = '/api/timeline/archive/' + article.id;
      $http.put(url).success(function(data) {
        $rootScope.$broadcast('app.event.timeline.status', data);
        humane.log('Article saved.');
        article.saved = true;
      });
    };

    $scope.trashArticle = function(article) {
      var url = '/api/timeline/archive/' + article.id;
      $http.delete(url).success(function(data) {
        $rootScope.$broadcast('app.event.timeline.status', data);
        humane.log('Article trashed.');
        article.saved = false;
      });
    };

    $scope.nextArticle = function() {
      if ($scope.articleIndex < $scope.articles.length - 1) {
        $scope.articleIndex++;
      }
    };

    $scope.prevArticle = function() {
      if ($scope.articleIndex > 0) {
        $scope.articleIndex--;
      }
    };

    // Key bindings...
    Mousetrap.bind(['right', 'n','space'], function() {
      $scope.$apply($scope.nextArticle);
    });
    Mousetrap.bind(['left', 'p', 'shift+space'], function() {
      $scope.$apply($scope.prevArticle);
    });
    Mousetrap.bind(['r'], function() {
      $scope.$apply($scope.refresh);
    });
    Mousetrap.bind(['q'], function() {
      var art = $scope.getCurrent();
      $scope.$apply(function() {
        if (art) {
          $scope.viewQrcode(art);
        }
      });
    });
    Mousetrap.bind(['m'], function() {
      var art = $scope.getCurrent();
      $scope.$apply(function() {
        if (art && art.read) {
          $scope.keepUnRead(art);
        } else if (art && !art.read) {
          $scope.markAsRead(art);
        }
      });
    });
    Mousetrap.bind(['s'], function() {
      var art = $scope.getCurrent();
      $scope.$apply(function() {
        if (art && art.saved) {
          $scope.trashArticle(art);
        } else if (art && !art.saved) {
          $scope.saveArticle(art);
        }
      });
    });
    Mousetrap.bind(['o'], function() {
      $scope.$apply(function() {
        $scope.order = $scope.order == 'ASC' ? 'DESC' : 'ASC';
      });
    });
    Mousetrap.bind(['v'], function() {
      if ($scope.timeline.feed) {
        $scope.$apply(function() {
          $scope.show = $scope.show == 'new' ? 'all' : 'new';
        });
      }
    });

    $scope.$watch('articleIndex', function(newValue) {
      // Use timeout to prevent animation flicker
      setTimeout($lazy.checkImages, 500);
      if ($scope.isReadable() && newValue > 0) {
        var article = $scope.articles[newValue-1];
        if (!article.read && !article.keepUnRead) {
          $timeout(function() {
            $scope.markAsRead(article);
          }, 500);
        }
      }
      if (!$scope.isEnded && newValue !== 0 && newValue >= $scope.articles.length - 1) {
        $timeout(function() {
          $scope.fetch();
        }, 500);
      }
    });

    $scope.$watch('order', function(newValue) {
      if (!initializing) {
        $scope.refresh();
      }
    });

    $scope.$watch('show', function(newValue) {
      if (!initializing) {
        $scope.refresh();
      }
    });

    $scope.fetch();

    $scope.viewQrcode = function(article) {
      $dialog({
        id: 'qrDialog',
        template:
          '<div class="row-fluid">' +
          '  <qrcode size="160" text="'+ article.link + '"></qrcode>' +
          '</div>',
        footerTemplate: '<button class="btn btn-primary" ng-click="$modalSuccess()">{{$modalSuccessLabel}}</button>',
        title: 'View QR code',
        backdrop: true,
        success: {label: 'ok', fn: function() {}}
      });
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
            $(this).attr('ui-lazy-load', src);
            $(this).removeAttr('data-src');
          }
        });
        $elem.html($compile($('<div>').append($content).html())($scope));
      });
    }
  };
}]);

