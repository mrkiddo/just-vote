'use strict';

/**
 * @ngdoc function
 * @name justVoteApp.controller:ItemCtrl
 * @description sigle poll item view controller, for user to vote and voting data review 
 * # ItemCtrl
 * Controller of the justVoteApp
 */
angular.module('justVoteApp').controller('ItemCtrl', function ($scope, Vote, History, initData, $q, $routeParams) {

	
	// if user has voted for this poll
	// show data review
	// otherwise, allow user to make a vote
	if(initData.exist)
		$scope.showResult = true;
	else
		$scope.showResult = null;

	$scope.disableSubmit = true;
	$scope.selected = 0;
	$scope.totalRate = 0;
	// vote id to retrieve this poll
	$scope.voteId = $routeParams.id;
	$scope.uid = initData.currentAuth.uid;

	// connect History service to scope
	$scope.history = History;

	// load this poll details from database
	$scope.vote = Vote.single($scope.voteId);
	$scope.vote.$loaded().then(function(data){
		angular.forEach(data.options, function(data){
			$scope.totalRate = $scope.totalRate + data.rate;
		});
	});

	// show the vote btn and record option index if any option is selected
	$scope.select = function(index){
		$scope.selected = index;
		console.log($scope.selected);
		if($scope.disableSubmit){
			$scope.disableSubmit = !$scope.disableSubmit;
		}
	}

	// proceed voting for submit button
	$scope.submit = function(){
		var deferred = $q.defer();
		$scope.disableSubmit = !$scope.disableSubmit;
		// increase the rate for selected option
		$scope.vote.options[$scope.selected].rate++;
		// update the record from database
		var votePromise = $scope.vote.$save();
		var historyPromise = $scope.history.add($scope.uid, $scope.vote.$id, $scope.selected);
		// if voting data and user voting record are already saved to database
		// show data review to user
		$q.all([votePromise, historyPromise]).then(function(results){
			//console.log(results[0].key() == $scope.vote.$id);
			$scope.totalRate = $scope.totalRate + 1;
			//console.log(results[1].key() + " vote is updated");
			$scope.showResult = true;
		});
	}
});
