'use strict';

describe('Filter: timeConvert', function () {

  // load the filter's module
  beforeEach(module('justVoteApp'));

  // initialize a new instance of the filter before each test
  var timeConvert;
  beforeEach(inject(function ($filter) {
    timeConvert = $filter('timeConvert');
  }));

  it('should return the input prefixed with "timeConvert filter:"', function () {
    var text = 'angularjs';
    expect(timeConvert(text)).toBe('timeConvert filter: ' + text);
  });

});
