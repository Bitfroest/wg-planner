angular.module('notification', [])
.controller('NotificationController', ['$scope', '$http', function($scope, $http) {
	$scope.notifications = [];
	
	function refresh() {
		$http.get('/api/notification').success(function(data) {
			console.log($scope.notifications);
		
			if(data.result) {
				$scope.notifications = data.result;
			}
		});
	}
	
	refresh();
	
	$scope.read = function(id) {
		$http.post('/api/notification/' + id + '/actions/read', {}, {
			headers : {'X-CSRF-Token' : $('#_csrf').val()}
		}).success(function(data) {
			console.log(data);
			
			refresh();
		});
	};
}]);
