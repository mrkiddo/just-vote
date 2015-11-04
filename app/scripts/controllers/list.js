'use strict';

/**
 * @ngdoc function
 * @name justVoteApp.controller:ListCtrl
 * @description list view controller, display a poll list
 * # ListCtrl
 * Controller of the justVoteApp
 */
angular.module('justVoteApp').controller('ListCtrl', function ($scope, Vote, initData) {

	$scope.selectPage = 1;
	$scope.itemInput = 3;
	$scope.itemPerPage = 3;
	$scope.showLatest = false;
	// connect vote service to scope
	$scope.Vote = Vote;
	$scope.votes = initData.listData;


	// handle page selected event
	$scope.selected = function(pageIndex){
		$scope.selectPage = pageIndex;
	};

	// handle filter for latest polls
	$scope.filterLatest = function(number){
		console.log($scope.showLatest);
		if($scope.showLatest){
			$scope.selectPage = 1;
			var tempStorage = $scope.votes.slice(0, number);
			$scope.votes = [];
			$scope.votes = tempStorage;
		}
		else{
			$scope.selectPage = 1;
			$scope.votes = initData.listData;
		}
	};

});
