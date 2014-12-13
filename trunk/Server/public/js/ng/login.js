angular.module('login', [])
.controller('LoginController', ['$scope', '$http', function($scope, $http) {
	
	$scope.doLogin = function() {
		$http.post('/api/account/actions/login', {
			email : $scope.login.email,
			password : $scope.login.password,
			persistent : $scope.login.persistent ? '1' : ''
		}, {
			headers : {'X-CSRF-Token' : $('#_csrf').val()}
		}).success(function() {
			window.location.href = '/dashboard';
		}).error(function(data) {
			new PNotify({
				title: 'Fehler',
				text: data.error,
				type: 'error'
			});
		});
	};
}]);

