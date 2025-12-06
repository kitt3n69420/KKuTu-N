const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'lib/Web/lib/kkutu/head.js');
let content = fs.readFileSync(filePath, 'utf8');

// Function to escape non-ASCII characters
function escapeUnicode(str) {
    return str.replace(/[^\x00-\x7F]/g, function (c) {
        return '\\u' + ('0000' + c.charCodeAt(0).toString(16)).slice(-4);
    });
}

// Find the BAD line
const badRegex = /var BAD = new RegExp\(\[(.*?)\]\.join\('\|'\), "g"\);/;
const match = content.match(badRegex);

if (match) {
    const originalArray = match[1];
    const escapedArray = escapeUnicode(originalArray);
    const newLine = `var BAD = new RegExp([${escapedArray}].join('|'), "g");`;

    content = content.replace(match[0], newLine);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log("Replaced BAD regex with Unicode escapes.");
} else {
    console.log("BAD regex not found.");
}
