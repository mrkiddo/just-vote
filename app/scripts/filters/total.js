'use strict';

/**
 * @ngdoc filter
 * @name justVoteApp.filter:total
 * @function
 * @description return the total voting user numbers using original data from database
 * # total
 * Filter in the justVoteApp.
 */
angular.module('justVoteApp').filter('total', function () {
    return function(obj){
		var totalNumber = 0;
		var options = obj.options;
		angular.forEach(options, function(data){
			totalNumber += data.rate;
		});
		return totalNumber;
	}
});
