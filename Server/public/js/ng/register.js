angular.module('register', [])
.controller('RegisterController', ['$scope', '$http', function($scope, $http) {
	
	$scope.doRegister = function() {
		$http.post('/api/account/actions/register', {
			name : $scope.register.name,
			email : $scope.register.email,
			password : $scope.register.password,
			terms : $scope.register.terms ? '1' : ''
		}, {
			headers : {'X-CSRF-Token' : $('#_csrf').val()}
		}).success(function() {
			window.location.href = '/login';
		}).error(function(data) {
			new PNotify({
				title: 'Fehler',
				text: data.error,
				type: 'error'
			});
		});
	};
}]);

