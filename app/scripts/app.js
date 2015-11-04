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
  .run(function($rootScope, $location){
    $rootScope.$on("$routeChangeError", function(event, next, previous, error){
      // user auth checking
      // if user is not authorized, redirect to login view
      if(error === "AUTH_REQUIRED"){
        $location.path("/login");
      }
    });
  })
  .config(function ($routeProvider) {
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
          initData: function(Auth, Vote, $q){
            var auth = Auth.auth.$requireAuth();
            var votes = Vote.read();
            return $q.all([auth, votes]).then(function(results){
              return {
                currentAuth: results[0],
                listData: results[1]
              };
            });
          }
        }
      })
      .when('/item/:id', {
        templateUrl: 'views/item.html',
        controller: 'ItemCtrl',
        controllerAs: 'item',
        resolve: {
          initData: function(Auth, History, $route, $q){
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
          }
        }
      })
      .when('/create', {
        templateUrl: 'views/create.html',
        controller: 'CreateCtrl',
        controllerAs: 'create',
        resolve: {
          // user auth checking, return a promise
          // if user is not authorized, broadcast a routeChangeError
          currentAuth: function(Auth){
            return Auth.auth.$requireAuth();
          }
        }
      })
      .when('/user', {
        templateUrl: 'views/user.html',
        controller: 'UserCtrl',
        controllerAs: 'user',
        resolve: {
          initData: function(Auth, Vote, History, $q){
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
          }
        }
      })
      .otherwise({
        redirectTo: '/list'
      });
  });
