'use strict';

/**
 * @ngdoc service
 * @name justVoteApp.Vote
 * @description provide services needed for poll items in terms of CURD
 * # Vote
 * Factory in the justVoteApp.
 */
angular.module('justVoteApp').factory('Vote', function ($firebaseObject, $firebaseArray, $q, firebaseUrl) {
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
});
