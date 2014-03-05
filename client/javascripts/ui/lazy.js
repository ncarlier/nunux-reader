'use strict';

// Module to manage lazy loading of images.
angular.module('ui.lazy', [])
.service('$lazy', ['$window', function($window) {
  // Maintain a list of images that lazy-loading
  // and have yet to be rendered.
  var images = [];

  // Define the render timer for the lazy loading
  // images to that the DOM-querying (for offsets)
  // is chunked in groups.
  var renderTimer = null;
  var renderDelay = 100;

  // Caching the window element as a jQuery reference.
  var win = $($window);

  // Define container holder.
  var container = '#timeline';
  // Determine the viewport boudaries.
  var boundaries = $(container)[0].getBoundingClientRect();

  // I determine if the window dimension events
  // (ie. resize, scroll) are currenlty being
  // monitored for changes.
  var isWatchingWindow = false;

  // ---
  // PUBLIC METHODS.
  // ---

  // I start monitoring the given image for visibility
  // and then render it when necessary.
  function addImage(image) {
    images.push(image);
    if (!renderTimer) {
      startRenderTimer();
    }
    if (!isWatchingWindow) {
      startWatchingWindow();
    }
  }

  // I remove the given image from the render queue.
  function removeImage(image) {
    // Remove the given image from the render queue.
    for (var i = 0 ; i < images.length ; i++) {
      if (images[i] === image) {
        images.splice(i, 1);
        break;
      }
    }

    // If removing the given image has cleared the
    // render queue, then we can stop monitoring
    // the window and the image queue.
    if (!images.length) {
      clearRenderTimer();
      stopWatchingWindow();
    }
  }

  // I check the lazy-load images that have yet to
  // be rendered.
  function checkImages() {
    // Log here so we can see how often this
    // gets called during page activity.
    console.log( "Checking for visible images..." );

    var visible = [];
    var hidden = [];

    // Query the DOM for layout and seperate the
    // images into two different categories: those
    // that are now in the viewport and those that
    // still remain hidden.
    for (var i = 0 ; i < images.length ; i++) {
      var image = images[i];
      if (image.isVisible(boundaries)) {
        visible.push(image);
      } else {
        hidden.push( image );
      }
    }

    // Update the DOM with new image source values.
    for (var j = 0 ; j < visible.length ; j++) {
      visible[j].render();
    }

    // Keep the still-hidden images as the new
    // image queue to be monitored.
    images = hidden;

    // Clear the render timer so that it can be set
    // again in response to window changes.
    clearRenderTimer();

    // If we've rendered all the images, then stop
    // monitoring the window for changes.
    if (!images.length) {
      stopWatchingWindow();
    }
  }

  // ---
  // PRIVATE METHODS.
  // ---

  // I clear the render timer so that we can easily
  // check to see if the timer is running.
  function clearRenderTimer() {
    clearTimeout( renderTimer );
    renderTimer = null;
  }

  // I start the render time, allowing more images to
  // be added to the images queue before the render
  // action is executed.
  function startRenderTimer() {
    renderTimer = setTimeout(checkImages, renderDelay);
  }

  // I start watching the window for changes in dimension.
  function startWatchingWindow() {
    isWatchingWindow = true;

    // Listen for window changes.
    win.on('resize.uiLazyLoad', onWindowChanged);
  }

  // I stop watching the window for changes in dimension.
  function stopWatchingWindow() {
    isWatchingWindow = false;

    // Stop watching for window changes.
    win.off('resize.uiLazyLoad');
  }

  // I start the render time if the window changes.
  function onWindowChanged() {
    if (!renderTimer) {
      boundaries = $(container)[0].getBoundingClientRect();
      startRenderTimer();
    }
  }

  // Return the public API.
  return({
    addImage: addImage,
    removeImage: removeImage,
    checkImages: checkImages,
    onScroll: onWindowChanged
  });
}]).directive('uiLazyScroll', ['$lazy', function($lazy) {
  return function ($scope, element, $attributes) {
    element.on('scroll.uiLazyLoad', $lazy.onScroll);
  };
}]).directive('uiLazyLoad', ['$window', '$lazy', function($window, $lazy) {
  // I represent a single lazy-load image.
  function LazyImage(element) {
    // I am the interpolated LAZY SRC attribute of
    // the image as reported by AngularJS.
    var source = null;

    // I determine if the image has already been
    // rendered (ie, that it has been exposed to the
    // viewport and the source had been loaded).
    var isRendered = false;

    // ---
    // PUBLIC METHODS.
    // ---

    // I determine if the element is in the viewport
    function isVisible(boundaries) {
      // If the element is not visible because it
      // is hidden, don't bother testing it.
      //if (!element.is(":visible")) {
      //  return(false);
      //}

      // Update the dimensions of the element.
      var top = element.offset().top;
      var left = element.offset().left;
      //console.log(this.getSource(), top, left, boundaries);

      // Return true if the element is:
      // 1. The top offset is in view.
      // 2. The left offset is in view.
      return (
        ((top <= boundaries.bottom) && (top >= boundaries.top)) &&
        ((left <= boundaries.right) && (left >= boundaries.left))
      );
    }

    // I move the cached source into the live source.
    function render() {
      isRendered = true;
      renderSource();
    }

    // I set the interpolated source value reported
    // by the directive / AngularJS.
    function setSource(newSource) {
      source = newSource;
      if (isRendered) {
        renderSource();
      }
    }

    // Get source image
    function getSource() {
      return source;
    }

    // ---
    // PRIVATE METHODS.
    // ---

    // I load the lazy source value into the actual
    // source value of the image element.
    function renderSource() {
      element[0].src = source;
    }


    // Return the public API.
    return({
      isVisible: isVisible,
      render: render,
      setSource: setSource,
      getSource: getSource
    });
  }

  // ------------------------------------------ //
  // ------------------------------------------ //

  // I bind the UI events to the scope.
  function link( $scope, element, attributes ) {
    var lazyImage = new LazyImage(element);
    // Start watching the image for changes in its
    // visibility.
    $lazy.addImage(lazyImage);

    // Since the lazy-src will likely need some sort
    // of string interpolation, we don't want to
    attributes.$observe(
      "uiLazyLoad",
      function(newSource) {
        lazyImage.setSource(newSource);
      }
    );

    // When the scope is destroyed, we need to remove
    // the image from the render queue.
    $scope.$on(
      "$destroy",
      function() {
        $lazy.removeImage(lazyImage);
      }
    );
  }

  // Return the directive configuration.
  return({
    link: link,
    restrict: "A"
  });
}]);
