var ocr = require('./routes/ocr');

if(process.argv.length != 3) {
  console.log("Usage: node test-ocr.js <image-file>");
  process.exit(1);
}

ocr.processReceipt(process.argv[2], function(err, result) {
  if(err) {
    console.log(err);
  } else {
    console.log(result);
  }
});
