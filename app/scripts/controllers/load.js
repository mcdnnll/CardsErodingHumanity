'use strict';

angular.module('caHApp')

  .controller('LoadCtrl', function ($scope, $location) {
    $scope.go = function(path) {
      $location.path(path);
      $scope.$apply();
    };
});
