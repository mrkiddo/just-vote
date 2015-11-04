'use strict';

/**
 * @ngdoc filter
 * @name justVoteApp.filter:range
 * @function
 * @description return the list record for current selected page
 * # range
 * Filter in the justVoteApp.
 */
angular.module('justVoteApp').filter('range', function ($filter) {
  	return function(data, page, size){;
		if(angular.isNumber(page) && angular.isNumber(size)){
			var startIndex = (page - 1) * size;
			if(data.length < startIndex){
				return [];
			}
			else{
				return $filter("limitTo")(data, size, startIndex);
			}
		}
		else{
			return data;
		}
	}
});
