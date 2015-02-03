angular.module('datepicker', ['ui.bootstrap'])
.controller('DatepickerCtrl', function ($scope) {
  
  $scope.selected = undefined;
  $scope.markets = ["AEZ","aktiv Discount (Edeka)","Akzenta","Aldi Nord","Aldi Süd","alnatura","Basic","Beki Schnellkauf","Bio Company","Bioladen","Biomarkt","Bonus Markt","Budni (Drogerie)","Bungert","C+C","CAP Markt","Citti","Coma","Combi","diska","diska West","Bauernladen","DM-Drogerie Markt","Frischemarkt","E aktiv markt","E center","E Frische Center","E Neukauf","EDEKA","EDEKA C+C Großmarkt","Edeka FrischeCenter","Edeka Nord","Edeka Nordbayern","EDEKA Berlin","Edeka Rhein Ruhr","EDEKA SB Union Großmarkt","Edeka Südbayern","Edeka Südwest","Elli Markt","Erdi","Erdkorn","famila Nordost","famila Nordwest","Fegro","Feneberg","Füllhorn","Getränkehaus","Globus","Grüner Markt","Handelshof / Koeln Cash & Carry","Hit","inkoop Verbrauchermärkte","italienischer Supermarkt","Jibi","K + K Klass & Kock","Kaisers","Kaisers Berlin / Umland","Kaisers Nordrhein","Kaufland","Kaufpark","Konsum Dresden","Landmanns Biomarkt","Lidl","LPG BioMarkt","Markant","Markant Nordwest","Marktkauf","Metro Cash & Carry","Minipreis","Mios","Mixmarkt","Müller Drogerie","Multi Markt","nah & gut","nahkauf","Naturgut Bio Supermarkt","Netto Marken-Discount","Netto-Supermarkt Stavenhagen","Norma","NP Discount","Penny Markt","Plaza West","pro Biomarkt","Real","Rewe","Rewe Center","Rewe City","Rewe Dortmund","Rewe Freidank","Rewe XL","Rossmann Drogerie","SB Zentralmarkt","Schaper CC","Selgros","Sky Coop","SuperBioMarkt","Tegut","TEMMA","Tengelmann","toom Getränkemarkt","toom Verbrauchermarkt","Treff 3000 Discount","Türkischer Supermarkt","V-Markt","Veganz","Vitalia Reformhaus","viv BioFrischeMarkt","VollCorner","WEZ Markt (Edeka Partner)","Conrad","Amazon","eBay"];
  
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