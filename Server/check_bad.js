const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'lib/Web/public/js/in_game_kkutu.js');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

// Find line with BAD
let badLine = -1;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('var BAD = new RegExp')) {
        badLine = i;
        break;
    }
}

if (badLine !== -1) {
    console.log(`Found BAD at line ${badLine + 1}:`);
    console.log(lines[badLine]);
} else {
    console.log("BAD not found");
}

console.log(`Line 828: ${lines[827]}`);
