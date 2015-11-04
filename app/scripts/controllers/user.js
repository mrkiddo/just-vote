'use strict';

/**
 * @ngdoc function
 * @name justVoteApp.controller:UserCtrl
 * @description user view controller, show user voting records
 * # UserCtrl
 * Controller of the justVoteApp
 */
angular.module('justVoteApp').controller('UserCtrl', function ($scope, initData) {
	
	$scope.showLatest = false;
	// get user id
	$scope.uid = initData.authData.uid;
	// load user voting history to view
	$scope.records = initData.listData;

	// filter latest records
	$scope.filterLatest = function(number){
		if($scope.showLatest)
			$scope.records = $scope.records.slice(0, number);
		else
			$scope.records = initData.listData;
	}
});
