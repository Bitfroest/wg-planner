
// Formats a Date in the format 'DD.MM.YYYY HH:MM'
// parameter type can be 'date', 'time' or nothing for date AND time
exports.formatDate = function(date, type) {
	var dateString = zeroPadding2(date.getDate()) + '.' + zeroPadding2(date.getMonth() + 1) + '.' + date.getFullYear();
	var timeString = zeroPadding2(date.getHours()) + ':' + zeroPadding2(date.getMinutes());
	
	switch(type) {
	case 'date': return dateString;
	case 'time': return timeString;
	default: return dateString + ' ' + timeString;
	}
};

// Takes a number of at most two digits and pads zeroes to the
// left until it reaches a length of 2
function zeroPadding2(x) {
	return ('0' + x).slice(-2);
}

exports.zeroPadding2 = zeroPadding2;
