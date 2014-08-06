
// Formats a Date in the format 'DD.MM.YYYY HH:MM'
exports.formatDate = function(date) {
	return zeroPadding2(date.getDate()) + '.' + zeroPadding2(date.getMonth() + 1) + '.' + date.getFullYear() 
		+ ' ' + zeroPadding2(date.getHours()) + ':' + zeroPadding2(date.getMinutes());
}

// Takes a number of at most two digits and padds zeroes to the
// left until it reaches a length of 2
function zeroPadding2(x) {
	return ('0' + x).slice(-2);
}