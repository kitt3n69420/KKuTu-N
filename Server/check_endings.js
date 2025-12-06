const fs = require('fs');
const path = require('path');

const KKUTU_LIST = [
    "lib/Web/lib/kkutu/head.js",
    "lib/Web/lib/kkutu/ready.js",
    "lib/Web/lib/kkutu/rule_classic.js",
    "lib/Web/lib/kkutu/rule_jaqwi.js",
    "lib/Web/lib/kkutu/rule_crossword.js",
    "lib/Web/lib/kkutu/rule_typing.js",
    "lib/Web/lib/kkutu/rule_hunmin.js",
    "lib/Web/lib/kkutu/rule_daneo.js",
    "lib/Web/lib/kkutu/rule_free.js",
    "lib/Web/lib/kkutu/rule_sock.js",
    "lib/Web/lib/kkutu/body.js",
    "lib/Web/lib/kkutu/tail.js"
];

KKUTU_LIST.forEach(file => {
    const filePath = path.join(__dirname, file);
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const lastChars = content.slice(-20).replace(/\n/g, '\\n');
        console.log(`${file}: ...${lastChars}`);
    } catch (e) {
        console.error(`Error reading ${file}: ${e.message}`);
    }
});
