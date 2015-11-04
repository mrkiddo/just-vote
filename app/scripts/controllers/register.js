'use strict';

/**
 * @ngdoc function
 * @name justVoteApp.controller:RegisterCtrl
 * @description register controller, user sign up
 * # RegisterCtrl
 * Controller of the justVoteApp
 */
angular.module('justVoteApp').controller('RegisterCtrl', function ($scope, History, $location, $interval) {

	$scope.history = History;
	$scope.createBtnText = "Register";

	// handle user register submit event
	$scope.create = function(){
		// input password checking
		if($scope.passwd1 != $scope.passwd2){
			$scope.error = "Password not match.";
			$scope.passwd1 = "";
			$scope.passwd2 = "";
			return false;
		}
		// change submit button state
		$scope.createBtnText = "Submitting...";
		// valid user email format
		var validResult = $scope.Auth.validUserInfo($scope.email, $scope.passwd1);
		if(!validResult.state){
			$scope.error = validResult.info;
			$scope.createBtnText = "Register";
			return false;
		}
		// if user mail is ok, ready to create a new user
		else{
			$scope.Auth.add($scope.email, $scope.passwd1).then(function(userData){
				// if user creating successfully, redirect to login view
				$scope.userData = userData;
				// redirect to login in 3 seconds
				var counter = 3;
				$interval(function(){
					$scope.createBtnText = "Successed. Redirect to log-in page in " + counter + "s";
					counter--;
					if(counter < 0)
						$location.path("/login");
				}, 1000);

			}).catch(function(error){
				// otherwise, show error message
				$scope.error = error;
				$scope.passwd1 = "";
				$scope.passwd2 = "";
			});
		}
	}

});
