angular.module('account', [])
.controller('AccountController', ['$scope', '$http', function($scope, $http) {
	$scope.person = {};
	
	function refresh() {
		$http.get('/api/account').success(function(data) {
			if(data.result) {
				$scope.person = data.result;
			}
		});
	}
	
	refresh();
	
	$scope.setName = function() {
		$http.put('/api/account', {
			name : $('input[name=name]').val()
		}, {
			headers : {'X-CSRF-Token' : $('#_csrf').val()}
		}).success(function(data) {
			$scope.person = data.result;
			
			new PNotify({
				title: 'Name geändert!',
				text: $scope.person.name,
				type: 'success'
			});
		}).error(function(data) {
			new PNotify({
				title: 'Fehler',
				text: data.error,
				type: 'error'
			});
		});
	};
	
	$scope.changePassword = function() {
		$http.post('/api/account/actions/change_password', {
			password_old : $('input[name=password_old]').val(),
			password : $('input[name=password]').val(),
			password_confirm : $('input[name=password_confirm]').val()
		},{
			headers : {'X-CSRF-Token' : $('#_csrf').val()}
		}).success(function() {
			new PNotify({
				title: 'Passwort geändert!',
				text: 'Verwende nun dein neues Passwort beim einloggen.',
				type: 'success'
			});
		}).error(function(data) {
			new PNotify({
				title: 'Fehler',
				text: data.error,
				type: 'error'
			});
		});
		
		// delete content of all password inputs
		$('input[name=password_old]').val('');
		$('input[name=password]').val('');
		$('input[name=password_confirm]').val('');
	};
}]);
