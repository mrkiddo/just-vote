'use strict';

/**
 * @ngdoc service
 * @name justVoteApp.Auth
 * @description provide services needed for user authorization
 * # Auth
 * Factory in the justVoteApp.
 */
angular.module('justVoteApp').factory('Auth', function ($firebaseAuth, firebaseUrl) {
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
});
