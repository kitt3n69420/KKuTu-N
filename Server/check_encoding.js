const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'lib/Web/lib/kkutu/body.js');
const content = fs.readFileSync(filePath, 'utf8');

if (content.includes('게스트는 캡챠 인증이 필요합니다.')) {
    console.log("Encoding seems correct (UTF-8).");
} else {
    console.log("Encoding might be wrong or string not found.");
    // Print a snippet around where it should be
    const index = content.indexOf('html(\'');
    if (index !== -1) {
        console.log("Snippet:", content.substring(index, index + 100));
    }
}
