'use strict';

/**
 * @ngdoc service
 * @name justVoteApp.History
 * @description provide the services needed for user voting histories
 * # History
 * Factory in the justVoteApp.
 */
angular.module('justVoteApp').factory('History', function ($firebaseArray, firebaseUrl) {
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
});
