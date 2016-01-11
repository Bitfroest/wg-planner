var tesseract = require('node-tesseract');
var config = require('../config');

function processReceipt(file, callback) {
  var options = {
    l: 'deu',
    psm : 3,
    binary : config.tesseractPath
  };

  tesseract.process(file, options, function (err, text) {
    if (err) {
      callback(err);
    } else {
      text = preprocessText(text);
      callback(null, {
        'shop' : processShop(text),
        'date' : processDateTime(text),
        'items' : processItems(text)
      });
    }
  });
}

function preprocessText(text) {
  return text.replace(/\u201A/g, ",");
}

var shopNames = ['Aldi', 'Rewe', 'Lidl', 'Kaufland'];

function processShop(text) {
  text = text.toLowerCase();

  return shopNames.find(function(name) {
    return text.indexOf(name.toLowerCase()) >= 0;
  });
}

function processDateTime(text) {
  var shortDate = /(\d{2})\.(\d{2})\.(\d{2})/;
  var longDate = /(\d{2})\.(\d{2})\.(\d{4})/
  var hmsTime = /(\d{2}):(\d{2}):(\d{2})/;
  var hmTime = /(\d{2}):(\d{2})/;

  var shortDateRes = shortDate.exec(text);
  var longDateRes = longDate.exec(text);
  var hmsTimeRes = hmsTime.exec(text);
  var hmTimeRes = hmTime.exec(text);

  if(shortDateRes || longDateRes) {
    var y, m, d;
    if(shortDateRes) {
      d = parseInt(shortDateRes[1]);
      m = parseInt(shortDateRes[2]) - 1;
      y = parseInt(shortDateRes[3]) + 2000;
    } else {
      d = parseInt(longDateRes[1]);
      m = parseInt(longDateRes[2]) - 1;
      y = parseInt(longDateRes[3]);
    }

    // time defaults to noon (12:00)
    var hour = 12, min = 0, sec = 0;

    if(hmsTimeRes) {
      hour = parseInt(hmsTimeRes[1]);
      min = parseInt(hmsTimeRes[2]);
      sec = parseInt(hmsTimeRes[3]);
    } else if(hmTimeRes) {
      hour = parseInt(hmTimeRes[1]);
      min = parseInt(hmTimeRes[2]);
    }

    return new Date(y, m, d, hour, min, sec);
  } else {
    return undefined;
  }
}

var blacklist = ["Summe", "Betrag", "Mwst", "Bar", "Zw-Summe", "Nettobetrag"];

function processItems(text) {
  return text
    .split("\n")
    .filter(function(line) {
      return line.match(/ \d+[,.]\d{2}/);
    })
    .map(function(line) {
      var result = /(.*) (\d+[,.]\d{2})/.exec(line);
      return {
        name : result[1],
        price : parseInt(result[2].replace(/[,.]/, ""))
      };
    })
    .filter(function(item) {
      return ! blacklist.some(function(blackword) {
        return item.name.replace(/\s/g, "").toLowerCase().indexOf(blackword.toLowerCase()) == 0;
      });
    });

  return items.slice(0, index);
}

exports.processReceipt = processReceipt;
