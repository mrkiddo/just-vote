'use strict';

describe('Directive: pagingButtonGroup', function () {

  // load the directive's module
  beforeEach(module('justVoteApp'));

  var element,
    scope;

  beforeEach(inject(function ($rootScope) {
    scope = $rootScope.$new();
  }));

  it('should make hidden element visible', inject(function ($compile) {
    element = angular.element('<paging-button-group></paging-button-group>');
    element = $compile(element)(scope);
    expect(element.text()).toBe('this is the pagingButtonGroup directive');
  }));
});
