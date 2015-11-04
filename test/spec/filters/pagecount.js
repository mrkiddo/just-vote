'use strict';

describe('Filter: pageCount', function () {

  // load the filter's module
  beforeEach(module('justVoteApp'));

  // initialize a new instance of the filter before each test
  var pageCount;
  beforeEach(inject(function ($filter) {
    pageCount = $filter('pageCount');
  }));

  it('should return the input prefixed with "pageCount filter:"', function () {
    var text = 'angularjs';
    expect(pageCount(text)).toBe('pageCount filter: ' + text);
  });

});
