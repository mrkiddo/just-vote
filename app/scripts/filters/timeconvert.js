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
