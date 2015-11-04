'use strict';

/**
 * @ngdoc function
 * @name justVoteApp.controller:CreateCtrl
 * @description controller for create view, create a new poll
 * # CreateCtrl
 * Controller of the justVoteApp
 */
angular.module('justVoteApp').controller('CreateCtrl', function ($scope, currentAuth, Vote, $location, $timeout) {

	$scope.list = [{ value: ""}, { value: ""}, { value: ""}];
	$scope.disabledSubmit = false;
	$scope.submitBtnText = "submit";
	$scope.uid = currentAuth.uid;
	$scope.vote = Vote;

	$scope.addOption = function(){
		$scope.list.push({value: ""});
	};

	// clear all the inputs
	$scope.clear = function(){
		$scope.title = "";
		for(var i = 0; i < $scope.list.length; i++){
			$scope.list[i].value = "";
		}
	};

	// user submit a vote
	$scope.submit = function(){

		if(!$scope.title){
			$scope.error = "Please type a title for the poll.";
			return false;
		}

		for(var i = 0; i < $scope.list.length; i++){
			if(!$scope.list[i].value){
				//console.log($scope.list[i].value);
				$scope.error = "Please fill all the blanks.";
				return false;
			}
		}

		var newOptions = [];
		$scope.disabledSubmit = true;
		$scope.submitBtnText = "Submitting...";

		// retrieve all the options in a poll
		for(var i = 0; i < $scope.list.length; i++){
			newOptions.push({
				content: $scope.list[i].value,
				rate: 0
			});
		}

		// create a new user voting record
		var newVote = {
			creater: $scope.uid,
			title: $scope.title,
			options: newOptions,
			date: new Date().getTime()
		};

		// add new record to database
		$scope.vote.add(newVote).then(function(ref){
			var id = ref.key();
			console.log("new vote added, id: " + id);
			//$location.path("/list");
			$scope.submitBtnText = "Successed!";
			$timeout(function(){
				$location.path("/list");
			}, 2000);
		});
		
	};
});
