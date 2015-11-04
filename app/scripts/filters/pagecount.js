'use strict';

/**
 * @ngdoc filter
 * @name justVoteApp.filter:pageCount
 * @function
 * @description calculate the number of pages should be applied
 * # pageCount
 * Filter in the justVoteApp.
 */
angular.module('justVoteApp').filter('pageCount', function () {
  	return function(data, size){
		var result = [];
		for(var i = 0; i < Math.ceil(data.length / size); i++){
			result.push(i);
		}
		return result;
	}
});
