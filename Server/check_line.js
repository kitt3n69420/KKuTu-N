const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'lib/Web/public/js/in_game_kkutu.js');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

console.log(`Line 4338: ${lines[4337]}`);
console.log(`Line 4339: ${lines[4338]}`);
console.log(`Line 4340: ${lines[4339]}`);
