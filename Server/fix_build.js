const fs = require('fs');
const path = require('path');
let UglifyJS;

try {
    UglifyJS = require('uglify-js');
} catch (e) {
    console.warn("uglify-js not found, skipping minification.");
}

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

const OUTPUT_LIB = "lib/Web/lib/in_game_kkutu.js";
const OUTPUT_PUBLIC = "lib/Web/public/js/in_game_kkutu.js";
const OUTPUT_MIN = "lib/Web/public/js/in_game_kkutu.min.js";

console.log("Starting build...");

let content = "\uFEFF";

// 1. Concatenate files
try {
    KKUTU_LIST.forEach(file => {
        const filePath = path.join(__dirname, file);
        console.log(`Reading ${filePath}...`);
        const fileContent = fs.readFileSync(filePath, 'utf8');
        content += fileContent + "\n";
    });
} catch (e) {
    console.error("Error reading files:", e);
    process.exit(1);
}

// 2. Write to lib/in_game_kkutu.js
try {
    const libPath = path.join(__dirname, OUTPUT_LIB);
    fs.writeFileSync(libPath, content, 'utf8');
    console.log(`Created ${libPath}`);
} catch (e) {
    console.error("Error writing lib file:", e);
}

// 3. Write to public/js/in_game_kkutu.js
try {
    const publicPath = path.join(__dirname, OUTPUT_PUBLIC);
    fs.writeFileSync(publicPath, content, 'utf8');
    console.log(`Created ${publicPath}`);
} catch (e) {
    console.error("Error writing public file:", e);
}

// 4. Minify and write to public/js/in_game_kkutu.min.js
if (UglifyJS) {
    try {
        console.log("Minifying...");
        const result = UglifyJS.minify(content);
        if (result.error) {
            console.error("Minification error:", result.error);
        } else {
            const minPath = path.join(__dirname, OUTPUT_MIN);
            // Add the wrapper as seen in Gruntfile
            const wrappedContent = "(function(){" + result.code + "})();";
            fs.writeFileSync(minPath, wrappedContent, 'utf8');
            console.log(`Created ${minPath}`);
        }
    } catch (e) {
        console.error("Error during minification:", e);
    }
} else {
    console.log("Skipping minification (uglify-js not installed). Copying non-minified version to min path.");
    const minPath = path.join(__dirname, OUTPUT_MIN);
    fs.writeFileSync(minPath, content, 'utf8');
    console.log(`Created ${minPath} (non-minified)`); //시발 없으면 없는대로 그냥 해
}

console.log("Build complete.");
