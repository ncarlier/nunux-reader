/**

  NUNUX Reader

  Copyright (c) 2013 Nicolas CARLIER (https://github.com/ncarlier)

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

'use strict';

angular.module('ReaderApp', [
  'ngRoute',
  'SidebarModule',
  'TimelineModule',
  'ManageModule',
  'ProfileModule',
  'TimelineService',
  'ArchiveService',
  'UserService',
  'ui.bootstrap',
  'angular-md5'
])
.config([
  '$routeProvider',
  function($routeProvider) {
    $routeProvider
    .when('/timeline/:timeline', {
      templateUrl: 'templates/views/timeline.html',
      controller: 'TimelineCtrl'
    })
    .when('/manage', {
      templateUrl: 'templates/views/manage.html',
      controller: 'ManageCtrl'
    })
    .when('/profile', {
      templateUrl: 'templates/views/profile.html',
      controller: 'ProfileCtrl'
     })
    .otherwise({
      redirectTo: '/timeline/global'
    });
  }
])
.filter('fromNow', function() {
  return function(dateString) {
    return moment(new Date(dateString)).fromNow();
  };
})
.filter('date', function() {
  return function(dateString) {
    return moment(new Date(dateString)).format('MMMM Do YYYY, h:mm:ss a');
  };
})
.filter('escape', function() {
  return window.encodeURIComponent;
})
.filter('unsafe', ['$sce', function($sce) {
  return function(val) {
    return $sce.trustAsHtml(val);
  };
}])
.filter('gravatar', ['md5', function(md5) {
  return function(val) {
    return val ? 'http://www.gravatar.com/avatar/' + md5.createHash(val.toLowerCase()) : null;
  };
}])
.filter('prefix', function() {
  return function(input, prefix) {
    return input ? prefix + ' ' + input : '';
  };
});
