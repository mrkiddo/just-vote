'use strict';

/**
 * @ngdoc directive
 * @name justVoteApp.directive:successIndicator
 * @description
 * # successIndicator
 */
angular.module('justVoteApp').directive('successIndicator', function () {
    return {
      template: '<div>Success</div>',
      restrict: 'E',
      link: function postLink(scope, element, attrs) {
        element.text('success');
      }
    };
});
