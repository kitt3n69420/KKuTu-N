const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'lib/Web/lib/kkutu/head.js');
const buffer = fs.readFileSync(filePath);

// Find "var BAD"
const index = buffer.indexOf('var BAD');
if (index !== -1) {
    console.log("Found 'var BAD' at index", index);
    // Print next 100 bytes in hex
    const snippet = buffer.slice(index, index + 100);
    console.log(snippet.toString('hex'));
    console.log(snippet.toString('utf8')); // Try to decode as UTF-8 to see if it matches
} else {
    console.log("'var BAD' not found");
}
