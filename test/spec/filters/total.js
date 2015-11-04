'use strict';

describe('Filter: total', function () {

  // load the filter's module
  beforeEach(module('justVoteApp'));

  // initialize a new instance of the filter before each test
  var total;
  beforeEach(inject(function ($filter) {
    total = $filter('total');
  }));

  it('should return the input prefixed with "total filter:"', function () {
    var text = 'angularjs';
    expect(total(text)).toBe('total filter: ' + text);
  });

});
