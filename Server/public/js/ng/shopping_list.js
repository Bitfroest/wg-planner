angular.module('shopping_list', ["xeditable"])
.controller('ShoppingListController', ['$scope', '$http', function($scope, $http) {
	$scope.shopping_items = [];
	
	function refresh() {
		$http.get('/api/shopping_item', {
        params: {
			shoppingListId : $('#shoppingListId').val()
		}
    }).success(function(data) {
			console.log($scope.shopping_items);
		
			if(data.result) {
				$scope.shopping_items = data.result;
			}
		});
	}
	
	$scope.delete = function(id) {
		$http.delete('/api/shopping_item/'+ id, {
			headers: {
				'X-CSRF-Token' : $('#_csrf').val()
			}
		}).success(function(data) {
			refresh();
		});
	};
	
	$scope.insert = function() {
		$http.post('/api/shopping_item', {
			name : $scope.name,
			shopping_list : $('#shoppingListId').val(),
			price : $scope.price,
			owner : $('#select-owner').val()
		}, {
			headers: {
				'X-CSRF-Token' : $('#_csrf').val()
			}
		}).success(function(data) {
			refresh();
		});
		
	};
	
	refresh();
}])
.filter('formatCurrency', function(){
	// http://stackoverflow.com/questions/149055/how-can-i-format-numbers-as-money-in-javascript
	return function(amount) {
		// convert Cents to Euro and localize
		// TODO for NodeJS this is not working as expected: the locale is not German
		amount = (amount / 100).toLocaleString();

		// Calculate decimal separator, '.' for English, ',' for German
		var decimalSeparator = (0.1).toLocaleString()[1];

		var arParts = amount.split(decimalSeparator);
		var intPart = arParts[0];
		var decPart = (arParts.length > 1 ? arParts[1] : '');
		decPart = (decPart + '00').substr(0,2);

		return '€ ' + intPart + decimalSeparator + decPart;
	};
}).run(function(editableOptions) {
  editableOptions.theme = 'bs3';
});
