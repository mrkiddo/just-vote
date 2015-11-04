'use strict';

/**
 * @ngdoc directive
 * @name justVoteApp.directive:routeLoadIndicator
 * @description a directive to loading spanner between the gap that each route is loaded
 * # routeLoadIndicator
 */
angular.module('justVoteApp').directive('routeLoadIndicator', function ($rootScope) {
    return {
        templateUrl: 'views/loading-spanner.html',
        restrict: 'E',
        link: function(scope, iElm, iAttrs, controller) {
            // set spanner to hide as default
			      scope.isRouteLoading = false;

            // if route start to change, show loading spanner
			      $rootScope.$on('$routeChangeStart', function(){
    			      scope.isRouteLoading = true;
  		      });

            // when route is successfully loaded, hide the spanner
  		      $rootScope.$on('$routeChangeSuccess', function(){
    			      scope.isRouteLoading = false;
  		      });
        }
    };
});
