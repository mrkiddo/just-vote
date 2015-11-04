'use strict';

/**
 * @ngdoc function
 * @name justVoteApp.controller:MainCtrl
 * @description main controller, take charge of user authorization and navigation functions within the top-bar
 * # MainCtrl
 * Controller of the justVoteApp
 */
angular.module('justVoteApp').controller('MainCtrl', function ($scope, Auth, $timeout, $location) {
	$scope.isCollapsed = true; //navbar toggle variable
	// connect Auth service to scope
	$scope.loginBtnText = "Login";
	$scope.loginDisabled = null;
	$scope.Auth = Auth;

	// retrieve user auth info
	$scope.Auth.auth.$onAuth(function(authData){
		$scope.authData = authData;
	});

	// login method for login btn
	// if login successfully, navigate to votes list
	// otherwise, display error message
	$scope.login = function(){
		if(!$scope.email || !$scope.passwd){
			$scope.error = "Please provide your account information.";
			return false;
		}
		// log user in
		// if success, redirect to poll list
		// otherwise, show error message
		$scope.Auth.login($scope.email, $scope.passwd).then(function(authData){
			$scope.authData = authData;
			$scope.loginDisabled = true;
			$scope.loginBtnText = "Successed!";
			$timeout(function(){
				$location.path("/");
			}, 1500);
			//$location.path("/");
		}).catch(function(error){
			console.log(error);
			$scope.error = error;
			$scope.loginBtnText = "Login";
			$scope.loginDisabled = null;
			$scope.passwd = "";
		});
	}

	// logout method for logout btn
	// navigate to login page after logout
	$scope.logout = function($event){
		$scope.Auth.logout();
		$location.path("/login");
		$event.preventDefault();
	}

});
