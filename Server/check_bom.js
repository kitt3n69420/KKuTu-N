const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'lib/Web/public/js/in_game_kkutu.js');
const buffer = fs.readFileSync(filePath);

if (buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
    console.log("BOM found.");
} else {
    console.log("BOM NOT found.");
    console.log("First 3 bytes:", buffer[0], buffer[1], buffer[2]);
}
