angular.module('datepicker', ['ui.bootstrap'])
.controller('DatepickerCtrl', function ($scope,$http) {
  
  $scope.selected = undefined;
  
   $scope.getShops = function(val) {
    return $http.get('/api/shopping_list/actions/shop_search', {
        params: {
			search: val
		}
    }).then(function(response){
      return response.data.result.map(function(item){
        return item.name;
      });
    });
  };
  
  $scope.startsWith = function(state, viewValue) {
	return state.substr(0, viewValue.length).toLowerCase() == viewValue.toLowerCase();
  } 
  
  $scope.today = function() {
    $scope.dt = new Date();
  };
  $scope.today();

  $scope.clear = function () {
    $scope.dt = null;
  };

  // Disable weekend selection
  $scope.disabled = function(date, mode) {
    return ( mode === 'day' && ( date.getDay() === 0 || date.getDay() === 6 ) );
  };

  $scope.toggleMin = function() {
    $scope.minDate = $scope.minDate ? null : new Date();
  };
  $scope.toggleMin();

  $scope.open = function($event) {
    $event.preventDefault();
    $event.stopPropagation();

    $scope.opened = true;
  };

  $scope.dateOptions = {
    formatYear: 'yy',
    startingDay: 1
  };

  $scope.formats = ['dd-MMMM-yyyy', 'yyyy/MM/dd', 'dd.MM.yyyy', 'shortDate', 'dd.MM.yyyy hh:mm'];
  $scope.format = $scope.formats[2];
});