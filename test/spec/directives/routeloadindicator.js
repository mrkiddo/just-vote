'use strict';

describe('Directive: routeLoadIndicator', function () {

  // load the directive's module
  beforeEach(module('justVoteApp'));

  var element,
    scope;

  beforeEach(inject(function ($rootScope) {
    scope = $rootScope.$new();
  }));

  it('should make hidden element visible', inject(function ($compile) {
    element = angular.element('<route-load-indicator></route-load-indicator>');
    element = $compile(element)(scope);
    expect(element.text()).toBe('this is the routeLoadIndicator directive');
  }));
});
