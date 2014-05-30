'use strict';

angular.module('TimelineModule', ['angular-carousel', 'ui.qrcode', 'ui.lazy'])
.controller('TimelineCtrl', [
  '$window', '$rootScope', '$scope', '$q', '$timeout', '$routeParams',
  '$lazy', '$log', '$modal', 'timelineService', 'archiveService', 'userService',
  function ($window, $rootScope, $scope, $q, $timeout, $routeParams,
            $lazy, $log, $modal, timelineService, archiveService, userService) {
    var initializing = true,
        tln = $routeParams.timeline;

    // defaults
    $scope.order = 'ASC';
    $scope.show = 'new';
    $scope.isEnded = false;
    $scope.articles = [];
    $scope.next = null;
    $scope.articleIndex = 0;

    $scope.isReadable = function() {
      return $scope.show === 'new';
    };

    $scope.getCurrent = function() {
      return $scope.articles.length > 0 ? $scope.articles[$scope.articleIndex] : null;
    };

    var fetchStatus = function() {
      timelineService.status(tln)
      .then(function(timeline) {
        $scope.timeline = timeline;
      });
    };
    fetchStatus();

    $scope.refresh = function() {
      $scope.articles = [];
      $scope.next = null;
      $scope.isEnded = false;
      $scope.fetch().then(fetchStatus);
    };

    $scope.fetch = function() {
      if ($scope.busy || $scope.isEnded) return;
      $scope.busy = true;
      $log.debug('Fetching articles...');
      return timelineService.fetch(tln, $scope.next, $scope.order, $scope.show)
      .then(function(data) {
        initializing = false;
        $scope.isEnded = !data.next;
        if ($scope.isEnded) {
          var end = {
            fake: true,
            link: 'foo/bar',
            description: '<h1>You reach ground 0</h1>'
          };
          data.articles.push(end);
        }
        for (var i = 0; i < data.articles.length; i++) {
          var article = data.articles[i];
          article.keepUnRead = false;
          article.read = false;
          article.reading = false;
          $scope.articles.push(article);
        }
        $scope.next = data.next;
        $scope.busy = false;
        $rootScope.$broadcast('app.event.subscriptions.refresh');
      });
    };

    $scope.markAllAsRead = function() {
      if ($scope.isReadable() && confirm('Do you really want to mark all items as read ?')) {
        timelineService.markAllAsRead(tln)
        .then(function(timeline) {
          $scope.timeline = timeline;
          $scope.articles = [];
          $scope.isEnded = true;
          $scope.next = null;
          $rootScope.$broadcast('app.event.timeline.status', timeline);
        });
      }
    };

    $scope.markAsRead = function(article) {
      if ($scope.isReadable()) {
        timelineService.markAsRead(tln, article.id)
        .then(function(timeline) {
          $scope.timeline = timeline;
          article.read = true;
          article.keepUnRead = false;
          $rootScope.$broadcast('app.event.timeline.status', timeline);
        });
      }
    };

    $scope.keepUnRead = function(article) {
      if ($scope.isReadable()) {
        timelineService.keepUnRead(tln, article.id)
        .then(function(timeline) {
          $scope.timeline = timeline;
          article.read = false;
          article.keepUnRead = true;
          $rootScope.$broadcast('app.event.timeline.status', timeline);
        });
      }
    };

    $scope.saveArticle = function(article) {
      var _save = function(_art, _providerName) {
        return archiveService.save(_art, _providerName).then(function(data) {
          humane.log('Article saved in ' + data.provider);
          $log.debug('Article saved in ' + data.provider + ': ' + data.ref);
          return data.ref;
        }, function(err) {
          var error = err && err.error ? err.error : err;
          alert('Unable to save article: ' + error);
        });
      };

      userService.getProviders().then(function(providers) {
        if (!providers || !providers.length) {
          return alert('Unable to save article. No archive provider found.');
        }
        if (providers.length > 1) {
          // More than one provider. Choose...
          var modalInstance = $modal.open({
            templateUrl: 'templates/dialog/archive-provider.html',
            controller: 'ArchiveProviderModalCtrl',
            resolve: {
              providers: function () {
                return providers;
              }
            }
          });
          modalInstance.result.then(function(providerName) {
            _save(article, providerName).then(function(ref) {
              article.archRef = ref;
            });
          }, function(reason) {
            $log.info('Archive provider modal dismissed: ' + reason);
          });
        } else {
          // Only one provider.
          _save(article, providers[0]).then(function(ref) {
            article.archRef = ref;
          });
        }
      });
    };

    $scope.trashArticle = function(article) {
      return alert('Feature disabled.');
      /*archiveService.remove(article).then(function(data) {
        humane.log('Article removed from ' + data.provider);
        article.archRef = null;
      }, function(err) {
        var error = err && err.error ? err.error : err;
        alert('Unable to remove article: ' + error);
      });*/
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
        $scope.toggleOrder();
      });
    });
    Mousetrap.bind(['v'], function() {
      if ($scope.timeline.feed) {
        $scope.$apply(function() {
          $scope.toggleShow();
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

    $scope.toggleOrder = function(order) {
      if (order) $scope.order = order;
      else $scope.order = $scope.order == 'ASC' ? 'DESC' : 'ASC';
    };

    $scope.toggleShow = function(show) {
      if (show) $scope.show = show;
      else $scope.show = $scope.show == 'new' ? 'all' : 'new';
    };

    $scope.$watch('order', function(newValue) {
      if (!initializing) $scope.refresh();
    });

    $scope.$watch('show', function(newValue) {
      if (!initializing) $scope.refresh();
    });

    $scope.viewQrcode = function(article) {
      $modal.open({
        templateUrl: 'templates/dialog/qrcode.html',
        controller: 'QRCodeModalCtrl',
        resolve: {
          article: function () {
            return article;
          }
        }
      });
    };

    // Fetch timeline
    $scope.fetch();
  }
])
.controller('QRCodeModalCtrl', [
  '$scope', '$modalInstance', 'article', function ($scope, $modalInstance, article) {
    $scope.link = article.link;
    $scope.ok = $modalInstance.close;
  }
])
.controller('ArchiveProviderModalCtrl', [
  '$scope', '$modalInstance', 'providers', function ($scope, $modalInstance, providers) {
    $scope.providers = providers;
    $scope.choose = $modalInstance.close;
    $scope.cancel = function () {
      $modalInstance.dismiss('cancel');
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

