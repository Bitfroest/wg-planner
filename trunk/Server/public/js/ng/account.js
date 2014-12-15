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
			name : $scope.person.name
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
			password_old : $scope.person.passwordOld,
			password : $scope.person.password,
			password_confirm : $scope.person.passwordConfirm
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
		$scope.person.passwordOld = '';
		$scope.person.password = '';
		$scope.person.passwordConfirm = '';
	};
}])
.directive('wgConfirm', function() {
	//console.log('directive init');

	return {
		require: 'ngModel',
		link: function(scope, elm, attrs, ngModel) {
			//console.log(attrs);

			scope.$watch(attrs.wgConfirm, function(originalValue) {
				var confirmedValue = scope.$eval(attrs.ngModel);
				
				//console.log('watch %s %s', confirmedValue, originalValue);
				
				ngModel.$setValidity('confirm', confirmedValue === originalValue);
			});

			ngModel.$parsers.unshift(function(confirmedValue) {
				var originalValue = scope.$eval(attrs.wgConfirm);

				//console.log('parser %s %s', confirmedValue, originalValue);

				if(originalValue === confirmedValue) {
					ngModel.$setValidity('confirm', true);
					return confirmedValue;
				} else {
					ngModel.$setValidity('confirm', false);
					return confirmedValue;
					//return undefined;
				}
			});
		}
	};
})
.filter('accountType', function() {
	var map = {customer:'Standard-Account', admin:'Admin'};

	return function(input) {
		return map[input];
	};
});

