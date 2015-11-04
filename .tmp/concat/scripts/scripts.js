'use strict';

/**
 * @ngdoc overview
 * @name justVoteApp
 * @description module definition, configuration and route definition
 * # justVoteApp
 *
 * Main module of the application.
 */
angular
  .module('justVoteApp', [
    'ngAnimate',
    'ngCookies',
    'ngRoute',
    'firebase',
    'ui.bootstrap'
  ])
  .run(["$rootScope", "$location", function($rootScope, $location){
    $rootScope.$on("$routeChangeError", function(event, next, previous, error){
      // user auth checking
      // if user is not authorized, redirect to login view
      if(error === "AUTH_REQUIRED"){
        $location.path("/login");
      }
    });
  }])
  .config(["$routeProvider", function ($routeProvider) {
    $routeProvider
      .when('/register', {
        templateUrl: 'views/register.html',
        controller: 'RegisterCtrl',
        controllerAs: 'register'
      })
      .when('/login', {
        templateUrl: 'views/login.html',
        controller: 'MainCtrl',
        controllerAs: 'main'
      })
      .when('/list', {
        templateUrl: 'views/list.html',
        controller: 'ListCtrl',
        controllerAs: 'list',
        resolve: {
          // two promises are used
          // one for user auth checking
          // the other for load the data from server
          initData: ["Auth", "Vote", "$q", function(Auth, Vote, $q){
            var auth = Auth.auth.$requireAuth();
            var votes = Vote.read();
            return $q.all([auth, votes]).then(function(results){
              return {
                currentAuth: results[0],
                listData: results[1]
              };
            });
          }]
        }
      })
      .when('/item/:id', {
        templateUrl: 'views/item.html',
        controller: 'ItemCtrl',
        controllerAs: 'item',
        resolve: {
          initData: ["Auth", "History", "$route", "$q", function(Auth, History, $route, $q){
            var auth = Auth.auth.$requireAuth(),
              historyRef = History.ref,
              userData,
              vid = $route.current.params.id,
              deferred = $q.defer();
            $q.when(auth).then(function(result){
              userData = result;
              historyRef.child(userData.uid).once("value", function(snapshot){
                var data = snapshot.val();
                angular.forEach(data, function(data){
                  if(data.id == vid)
                    deferred.resolve({exist: true, currentAuth: userData});
                });
                deferred.resolve({exist: false, currentAuth: userData});
              });
            });
            return deferred.promise;
          }]
        }
      })
      .when('/create', {
        templateUrl: 'views/create.html',
        controller: 'CreateCtrl',
        controllerAs: 'create',
        resolve: {
          // user auth checking, return a promise
          // if user is not authorized, broadcast a routeChangeError
          currentAuth: ["Auth", function(Auth){
            return Auth.auth.$requireAuth();
          }]
        }
      })
      .when('/user', {
        templateUrl: 'views/user.html',
        controller: 'UserCtrl',
        controllerAs: 'user',
        resolve: {
          initData: ["Auth", "Vote", "History", "$q", function(Auth, Vote, History, $q){
            var auth = Auth.auth.$requireAuth(),
              userData,
              idCollection = [],
              optionCollection = [],
              records = [],
              historyService = History,
              deferred = $q.defer();
            $q.when(auth).then(function(result){
              userData = result;
              historyService.all(userData.uid).$loaded().then(function(data){
                angular.forEach(data, function(data){
                  idCollection.push(data.id);
                  optionCollection.push(data.option);
                });
                for(var i = 0; i < idCollection.length; i++){
                  Vote.ref.child(idCollection[i]).once("value", function(snapshot){
                    var data = snapshot.val();
                    var optionIndex = optionCollection[i];
                    records.push({
                      id: idCollection[i],
                      title: data.title,
                      date: data.date,
                      option: data.options[optionIndex].content
                    });
                  });
                }
                deferred.resolve({authData: userData, listData: records});
              });
            });
            return deferred.promise;
          }]
        }
      })
      .otherwise({
        redirectTo: '/list'
      });
  }]);

'use strict';

/**
 * @ngdoc function
 * @name justVoteApp.controller:MainCtrl
 * @description main controller, take charge of user authorization and navigation functions within the top-bar
 * # MainCtrl
 * Controller of the justVoteApp
 */
angular.module('justVoteApp').controller('MainCtrl', ["$scope", "Auth", "$timeout", "$location", function ($scope, Auth, $timeout, $location) {
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

}]);

'use strict';

/**
 * @ngdoc function
 * @name justVoteApp.controller:RegisterCtrl
 * @description register controller, user sign up
 * # RegisterCtrl
 * Controller of the justVoteApp
 */
angular.module('justVoteApp').controller('RegisterCtrl', ["$scope", "History", "$location", "$interval", function ($scope, History, $location, $interval) {

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

}]);

'use strict';

/**
 * @ngdoc function
 * @name justVoteApp.controller:ListCtrl
 * @description list view controller, display a poll list
 * # ListCtrl
 * Controller of the justVoteApp
 */
angular.module('justVoteApp').controller('ListCtrl', ["$scope", "Vote", "initData", function ($scope, Vote, initData) {

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

}]);

'use strict';

/**
 * @ngdoc function
 * @name justVoteApp.controller:ItemCtrl
 * @description sigle poll item view controller, for user to vote and voting data review 
 * # ItemCtrl
 * Controller of the justVoteApp
 */
angular.module('justVoteApp').controller('ItemCtrl', ["$scope", "Vote", "History", "initData", "$q", "$routeParams", function ($scope, Vote, History, initData, $q, $routeParams) {

	
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
}]);

'use strict';

/**
 * @ngdoc function
 * @name justVoteApp.controller:CreateCtrl
 * @description controller for create view, create a new poll
 * # CreateCtrl
 * Controller of the justVoteApp
 */
angular.module('justVoteApp').controller('CreateCtrl', ["$scope", "currentAuth", "Vote", "$location", "$timeout", function ($scope, currentAuth, Vote, $location, $timeout) {

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
}]);

'use strict';

/**
 * @ngdoc function
 * @name justVoteApp.controller:UserCtrl
 * @description user view controller, show user voting records
 * # UserCtrl
 * Controller of the justVoteApp
 */
angular.module('justVoteApp').controller('UserCtrl', ["$scope", "initData", function ($scope, initData) {
	
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
}]);

'use strict';

/**
 * @ngdoc service
 * @name justVoteApp.Vote
 * @description provide services needed for poll items in terms of CURD
 * # Vote
 * Factory in the justVoteApp.
 */
angular.module('justVoteApp').factory('Vote', ["$firebaseObject", "$firebaseArray", "$q", "firebaseUrl", function ($firebaseObject, $firebaseArray, $q, firebaseUrl) {
    // Service logic
    var ref = new Firebase(firebaseUrl + "/votes");
    var votes = $firebaseArray(ref);

    // Public API here
    return {
        all: votes,
        ref: ref,
        add: function(newVote){
            return votes.$add(newVote);
        },
        get: function(voteId){
            return votes.$getRecord(voteId);
        },
        single: function(voteId){
            return $firebaseObject(ref.child(voteId));
        },
        read: function(){
            return $firebaseArray(ref).$loaded();
        }
    };
}]);

'use strict';

/**
 * @ngdoc service
 * @name justVoteApp.firebaseUrl
 * @description save the firebase database reference url for other services
 * # firebaseUrl
 * Constant in the justVoteApp.
 */
angular.module('justVoteApp').constant('firebaseUrl', "https://popping-heat-1428.firebaseio.com");

'use strict';

/**
 * @ngdoc service
 * @name justVoteApp.Auth
 * @description provide services needed for user authorization
 * # Auth
 * Factory in the justVoteApp.
 */
angular.module('justVoteApp').factory('Auth', ["$firebaseAuth", "firebaseUrl", function ($firebaseAuth, firebaseUrl) {
    // Service logic
    var ref = new Firebase(firebaseUrl);
    var auth = $firebaseAuth(ref);

    // Public API here
    return {
        auth: auth,
        ref: ref,
        login: function(email, password){
            return auth.$authWithPassword({email: email, password: password});
        },
        logout: function(){
            return auth.$unauth();
        },
        add: function(email, password){
            return auth.$createUser({email: email, password: password});
        },
        validUserInfo: function(email, password){
            var emailPattern = /^[0-9a-z][_.0-9a-z-]{0,31}@([0-9a-z][0-9a-z-]{0,30}[0-9a-z]\.){1,4}[a-z]{2,4}$/;
            if(!emailPattern.test(email)){
                return {
                  state: false,
                  info: "Please input a correct email address."
                };
            }
            if(password.length < 6){
                return {
                  state: false,
                  info: "Password must no shorter than 6 character."
                };
            }
            return {
                state: true,
                info: "correct"
            };
          }
      };
}]);

'use strict';

/**
 * @ngdoc service
 * @name justVoteApp.History
 * @description provide the services needed for user voting histories
 * # History
 * Factory in the justVoteApp.
 */
angular.module('justVoteApp').factory('History', ["$firebaseArray", "firebaseUrl", function ($firebaseArray, firebaseUrl) {
    // Service logic
    var ref = new Firebase(firebaseUrl + "/history");
    var history = $firebaseArray(ref);

    // Public API here
    return {
        ref: ref,
        all: function(userId){
            return $firebaseArray(ref.child(userId));
        },
        add: function(userId, voteId, optionIndex){
            return $firebaseArray(ref.child(userId)).$add({
                date: new Date().getTime(),
                id: voteId,
                option: optionIndex
            });
        }
    };
}]);

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

'use strict';

/**
 * @ngdoc filter
 * @name justVoteApp.filter:timeConvert
 * @function
 * @description convert the time stamp in database into actual numbers of time
 * # timeConvert
 * Filter in the justVoteApp.
 */
angular.module('justVoteApp').filter('timeConvert', function () {
    return function(createTime){
		if(createTime == null){
			return "n/a";
		}
		var currentTime = new Date().getTime();
		var offset = currentTime - createTime;
    // generate days, hours, minutes if possible
		var days = Math.floor(offset/ (60000 * 60 * 24));
		var hours = Math.floor(offset/(60000 * 60));
		var minutes = Math.floor(offset/60000);
        var seconds = "Just now";
        if(days > 0){
            return days + " days ago";
        }
        else if(hours > 0){
           return hours + " hours ago";
        }
        else if(minutes > 1){
           return minutes + " minutes ago";
        }
        else{
           return seconds;
        }
	}
});

'use strict';

/**
 * @ngdoc filter
 * @name justVoteApp.filter:range
 * @function
 * @description return the list record for current selected page
 * # range
 * Filter in the justVoteApp.
 */
angular.module('justVoteApp').filter('range', ["$filter", function ($filter) {
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
}]);

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

'use strict';

/**
 * @ngdoc directive
 * @name justVoteApp.directive:routeLoadIndicator
 * @description a directive to loading spanner between the gap that each route is loaded
 * # routeLoadIndicator
 */
angular.module('justVoteApp').directive('routeLoadIndicator', ["$rootScope", function ($rootScope) {
    return {
        templateUrl: 'views/loading-spanner.html',
        restrict: 'E',
        link: function(scope, iElm, iAttrs, controller) {
            // set spanner to hide as default
			      scope.isRouteLoading = false;

            // if route start to change, show loading spanner
			      $rootScope.$on('$routeChangeStart', function(){
    			      scope.isRouteLoading = true;
  		      });

            // when route is successfully loaded, hide the spanner
  		      $rootScope.$on('$routeChangeSuccess', function(){
    			      scope.isRouteLoading = false;
  		      });
        }
    };
}]);

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

angular.module('justVoteApp').run(['$templateCache', function($templateCache) {
  'use strict';

  $templateCache.put('views/create.html',
    "<div class=\"container\"> <div class=\"row\"> <div class=\"hidden-xs hidden-sm col-md-7 col-lg-7\"> <h2>Initiate a Vote</h2> <h4>Just be curious how others think</h4> <div class=\"vote-img\"> <img src=\"images/flat-icon/pencil-retina.svg\"> </div> </div> <div class=\"visible-sm-12 hidden-md hidden-lg welcome-title\"> <h2>Initiate a Vote</h2> <h4>Just be curious how others think</h4> </div> <div class=\"col-xs-12 col-sm-12 col-md-5 col-lg-5\"> <div class=\"panel panel-default panel-item panel-login\"> <h5 class=\"login-title\">Create <span class=\"pull-right\"><span class=\"fui-plus\"></span></span></h5> <div class=\"alert-login\" ng-bind=\"error\"></div> <div class=\"form-group\" align=\"center\"> <div class=\"input-group\"> <span class=\"input-group-addon\"><span class=\"fui-new\"></span></span> <input type=\"text\" class=\"form-control\" placeholder=\"Title for your vote\" ng-model=\"title\"> </div> </div> <div class=\"form-group\" id=\"marker\" align=\"center\" ng-repeat=\"item in list\"> <div class=\"input-group\"> <span class=\"input-group-addon\"><span class=\"fui-radio-checked\"></span></span> <input type=\"text\" class=\"form-control\" placeholder=\"Type an option\" ng-model=\"item.value\"> </div> </div> <div class=\"form-group\" align=\"center\"> <button type=\"button\" class=\"btn btn-primary btn-lg btn-block btn-login\" ng-click=\"addOption()\">Add Option</button> </div> <div class=\"form-group\" align=\"center\"> <button type=\"button\" class=\"btn btn-primary btn-lg btn-block btn-login\" ng-click=\"clear()\">Clear</button> </div> <div class=\"form-group\" align=\"center\"> <button type=\"button\" class=\"btn btn-primary btn-lg btn-block btn-login\" ng-click=\"submit()\" ng-disabled=\"disabledSubmit\" ng-bind=\"submitBtnText\"></button> </div> </div> </div> </div> </div>"
  );


  $templateCache.put('views/item.html',
    "<div class=\"container\"> <div class=\"row row-title\"> <div class=\"col-md-12 col-lg-12\"> <h2>Vote It</h2> <h4>Choose and show your opinion</h4> </div> </div> <div class=\"row\"> <div class=\"hidden-xs hidden-sm col-md-4 col-lg-3\"> <div class=\"todo\"> <div class=\"todo-search\"> <strong>Navigator</strong> <span class=\"pull-right\"><span class=\"fui-list-large-thumbnails\"></span></span> </div> <ul> <li class=\"todo-done\"> <div class=\"todo-content item-navigator\"> <span class=\"fui-checkbox-checked\"></span> <span> {{vote | total}} Attenders</span> </div> </li> <li class=\"todo-done item-navigator\"> <div class=\"todo-content\"> <span class=\"fui-time\"></span> <span> {{vote.date | timeConvert}}</span> </div> </li> <li class=\"todo-done item-navigator\"> <div class=\"todo-content\"> <a type=\"button\" ng-href=\"#/list\" class=\"btn btn-primary\"><span class=\"fui-arrow-left\"></span>Back to list</a> </div> </li> </ul> </div> </div><!-- sidebar --> <div class=\"col-xs-12 col-sm-12 col-md-8 col-lg-9 item-content\" ng-hide=\"showResult\"> <h4 class=\"vote-item-title\">{{vote.title}}</h4> <div class=\"panel-item panel-item-voted\">Choose one of the following options.</div> <div ng-repeat=\"(key, value) in vote.options\"> <input type=\"radio\" value=\"{{key}}\" name=\"item\" ng-click=\"select(key)\"><label class=\"option-label\"> &nbsp;{{value.content}}</label> </div> <br> <button class=\"btn btn-primary btn-vote\" ng-click=\"submit()\" ng-disabled=\"disableSubmit\"><span class=\"fui-check\"></span>&nbsp;&nbsp;Vote</button> <hr> </div><!-- choose view --> <div class=\"col-xs-12 col-sm-12 col-md-8 col-lg-9 item-content\" ng-show=\"showResult\"> <h4 class=\"vote-item-title\">{{vote.title}}</h4> <div class=\"panel-item panel-item-voted\">You have voted. Thank you! Here is the review.</div> <div ng-repeat=\"(key, value) in vote.options\"> <strong>{{value.content}}</strong> - {{value.rate}} out of {{totalRate}} <div class=\"progress\"> <div class=\"progress-bar\" role=\"progressbar\" aria-valuenow=\"{{value.rate/totalRate*100}}\" aria-valuemin=\"0\" aria-valuemax=\"100\" style=\"width: {{value.rate/totalRate*100}}%\">{{value.rate/totalRate*100 | number:1}}%</div> </div> </div> </div><!-- result view --> </div><!-- row --> </div><!-- container -->"
  );


  $templateCache.put('views/list.html',
    "<div class=\"container\"> <div class=\"row row-title\"> <div class=\"col-md-12 col-lg-12\"> <h2>Vote List</h2> <h4>Pick an item you interested</h4> </div> </div> <div class=\"row\"> <div class=\"hidden-xs hidden-sm col-md-4 col-lg-3\"> <div class=\"todo\"> <div class=\"todo-search\"> <strong>Filter</strong> <span class=\"pull-right\"><span class=\"fui-gear\"></span></span> </div> <ul> <li class=\"todo-done\"> <div class=\"todo-content\"> <span class=\"item-num-control\">Total items: {{votes.length}}</span> </div> </li> <li class=\"todo-done\"> <div class=\"todo-content\"> <span class=\"item-num-control\">Items per Page: {{itemPerPage}}</span> </div> </li> <li class=\"todo-done\"> <div class=\"todo-content\"> <span class=\"item-num-control\">Current Page: {{selectPage}}</span> </div> </li> <li> <div class=\"todo-content\"> <label class=\"checkbox\" for=\"hideVoted\"> <input type=\"checkbox\" ng-model=\"showLatest\" name=\"showLatest\" ng-change=\"filterLatest(5)\"> <strong>Show latest polls</strong> </label> </div> </li> </ul> </div> </div><!-- sidebar --> <div class=\"col-xs-12 col-sm-12 col-md-8 col-lg-9\"> <div class=\"panel panel-default panel-item\" ng-repeat=\"(key, value) in votes | range:selectPage:itemPerPage\"> <div class=\"panel-body\"> <h5 class=\"vote-title\"><a ng-href=\"#/item/{{value.$id}}\">{{value.title}}</a></h5> <p><small> <span class=\"fui-checkbox-checked\"></span> <span>{{value | total}} Attended | </span> <span class=\"fui-time\"></span> <span>{{value.date | timeConvert}}</span> <span class=\"fui-star-2 pull-right\"></span> </small></p> </div> </div> <div class=\"btn-group\"> <button ng-repeat=\"vote in votes | pageCount:itemPerPage\" ng-click=\"selected($index + 1)\" class=\"btn btn-primary\">{{$index + 1}}</button> </div> </div><!-- main content --> </div><!-- row --> </div><!-- container -->"
  );


  $templateCache.put('views/loading-spanner.html',
    "<div class=\"sk-circle\" ng-if=\"isRouteLoading\"> <div class=\"sk-circle1 sk-child\"></div> <div class=\"sk-circle2 sk-child\"></div> <div class=\"sk-circle3 sk-child\"></div> <div class=\"sk-circle4 sk-child\"></div> <div class=\"sk-circle5 sk-child\"></div> <div class=\"sk-circle6 sk-child\"></div> <div class=\"sk-circle7 sk-child\"></div> <div class=\"sk-circle8 sk-child\"></div> <div class=\"sk-circle9 sk-child\"></div> <div class=\"sk-circle10 sk-child\"></div> <div class=\"sk-circle11 sk-child\"></div> <div class=\"sk-circle12 sk-child\"></div> </div>"
  );


  $templateCache.put('views/login.html',
    "<div class=\"container\"> <div class=\"row\"> <div class=\"hidden-xs hidden-sm col-md-7 col-lg-7\"> <h2>Welcome, voter !</h2> <h4>Sign in and stand by what you like</h4> <div class=\"vote-img\"> <img src=\"images/flat-icon/vote-retina.svg\"> </div> </div> <div class=\"visible-sm-12 hidden-md hidden-lg welcome-title\"> <h2>Welcome, voter !</h2> <h4>Sign in and stand by what you like</h4> </div> <div class=\"col-xs-12 col-sm-12 col-md-5 col-lg-5\"> <div class=\"panel panel-default panel-item panel-login\"> <h5 class=\"login-title\">Login <span class=\"pull-right\"><span class=\"fui-user\"></span></span></h5> <div class=\"alert-login\" ng-bind=\"error\" ng-show=\"error\"></div> <div class=\"form-group\" align=\"center\"> <div class=\"input-group\"> <span class=\"input-group-addon\"><span class=\"fui-mail\"></span></span> <input type=\"email\" class=\"form-control\" placeholder=\"E-Mail\" ng-model=\"email\"> </div> </div> <div class=\"form-group\" align=\"center\"> <div class=\"input-group\"> <span class=\"input-group-addon\"><span class=\"fui-lock\"></span></span> <input type=\"password\" class=\"form-control\" placeholder=\"Password\" ng-model=\"passwd\"> </div> </div> <div class=\"form-group\" align=\"center\"> <button type=\"button\" class=\"btn btn-primary btn-lg btn-block btn-login\" ng-click=\"login()\" ng-disabled=\"!(email&&passwd) || loginDisabled\" ng-bind=\"loginBtnText\"></button> </div> <p class=\"register-link\" style=\"text-align: center\">Not a voter?&nbsp;<a ng-href=\"#/register\">Register</a></p> </div> </div> </div> </div>"
  );


  $templateCache.put('views/register.html',
    "<div class=\"container\"> <div class=\"row\"> <div class=\"hidden-xs hidden-sm col-md-7 col-lg-7\"> <h2>Become a voter</h2> <h4>Toward the world of polls and votes</h4> <div class=\"vote-img\"> <img src=\"images/flat-icon/loop-retina.svg\"> </div> </div> <div class=\"visible-sm-12 hidden-md hidden-lg welcome-title\"> <h2>Become a voter</h2> <h4>Towards the world of polls and votes</h4> </div> <div class=\"col-xs-12 col-sm-12 col-md-5 col-lg-5\"> <div class=\"panel panel-default panel-item panel-login\"> <h5 class=\"login-title\">Register <span class=\"pull-right\"><span class=\"fui-plus-circle\"></span></span></h5> <div class=\"alert-login\" ng-bind=\"error\" ng-show=\"error\"></div> <div class=\"form-group\" align=\"center\"> <div class=\"input-group\"> <span class=\"input-group-addon\"><span class=\"fui-mail\"></span></span> <input type=\"email\" class=\"form-control\" placeholder=\"Your E-Mail\" ng-model=\"email\"> </div> </div> <div class=\"form-group\" align=\"center\"> <div class=\"input-group\"> <span class=\"input-group-addon\"><span class=\"fui-lock\"></span></span> <input type=\"password\" class=\"form-control\" placeholder=\"Choose a Password\" ng-model=\"passwd1\"> </div> </div> <div class=\"form-group\" align=\"center\"> <div class=\"input-group\"> <span class=\"input-group-addon\"><span class=\"fui-lock\"></span></span> <input type=\"password\" class=\"form-control\" placeholder=\"Repeat your Password\" ng-model=\"passwd2\"> </div> </div> <div class=\"form-group\" align=\"center\"> <button type=\"button\" class=\"btn btn-primary btn-lg btn-block btn-login\" ng-click=\"create()\" ng-disabled=\"!(email && passwd1 && passwd2)\" ng-bind=\"createBtnText\"></button> </div> <p class=\"register-link\" style=\"text-align: center\">Already a voter?&nbsp;<a ng-href=\"#/login\">Login</a></p> </div> </div> </div> </div>"
  );


  $templateCache.put('views/user.html',
    "<div class=\"container\"> <div class=\"row row-title\"> <div class=\"col-md-12 col-lg-12\"> <h2>Vote History</h2> <h4>Review what you voted for</h4> </div> </div> <div class=\"row\"> <div class=\"hidden-xs hidden-sm col-md-4 col-lg-3\"> <div class=\"todo\"> <div class=\"todo-search\"> <strong>Filter</strong> <span class=\"pull-right\"><span class=\"fui-gear\"></span></span> </div> <ul> <li class=\"todo-done\"> <div class=\"todo-content\"> <label class=\"checkbox\" for=\"showNew\"> <input type=\"checkbox\" ng-model=\"showLatest\" name=\"showLatest\" ng-change=\"filterLatest(5)\"> <strong>Only show latest records</strong> </label> </div> </li> <li class=\"todo-done item-navigator\"> <div class=\"todo-content\"> <a type=\"button\" ng-href=\"#/list\" class=\"btn btn-primary\"><span class=\"fui-arrow-left\"></span>Back to list</a> </div> </li> </ul> </div> </div><!-- sidebar --> <div class=\"col-xs-12 col-sm-12 col-md-8 col-lg-9 history-wrapper\"> <div class=\"well well-info\"> <span class=\"fui-list-bulleted\" style=\"color: #1ABC9C\"></span> <span class=\"item-num-control\">Total items: {{records.length}} </span> </div><!-- list info --> <div class=\"col-sm-12 col-md-6 col-lg-4 history-item\" ng-repeat=\"record in records\"> <div class=\"history-item-content\"> <p><a ng-href=\"#/item/{{record.id}}\" title=\"{{record.title}}\">{{record.title}}</a></p> <span class=\"fui-checkbox-checked\"></span><span> Your choice: {{record.option}}</span><br> <span class=\"fui-time\"></span><span> {{record.date | timeConvert}}</span> </div> </div> <div class=\"col-sm-12 col-md-6 col-lg-4 history-item\"> <div class=\"history-item-content history-add-item\"> <p><a href=\"#/create\" title=\"Initial a new vote\">Initial a new vote</a></p> <span>&nbsp;</span><br> <span>&nbsp;</span> </div> </div> </div><!-- main content --> </div><!-- row --> </div><!-- container -->"
  );

}]);
