
var DB = require('./Web/db');
var Const = require('./const');
var fs = require('fs');

console.log("Initializing...");

DB.ready = function (Redis, Pg) {
    console.log("DB Connected. Starting filtered analysis...");

    // Query: 2-letter words, Standard Group, Exclude Injeong
    DB.kkutu['ko'].find(
        ['_id', /^..$/],
        ['type', Const.KOR_GROUP],
        ['flag', { '$nand': Const.KOR_FLAG.INJEONG }]
    ).on(function (words) {
        console.log("Found " + words.length + " words (No Injeong).");

        var counts = {};
        words.forEach(function (w) {
            var first = w._id.charAt(0);
            counts[first] = (counts[first] || 0) + 1;
        });

        // Filter >= 100 and Sort
        var sorted = Object.keys(counts)
            .filter(function (s) { return counts[s] >= 100; })
            .sort(function (a, b) { return counts[b] - counts[a]; });

        console.log("Found " + sorted.length + " syllables with >= 100 words.");

        var output = "Syllable | Count\n" +
            "---------|------\n";

        sorted.forEach(function (s) {
            output += s + " | " + counts[s] + "\n";
        });

        var outputPath = "2letter_syllables_100plus.txt";
        fs.writeFile(outputPath, output, function (err) {
            if (err) {
                console.error("Error writing file:", err);
                process.exit(1);
            }
            console.log("Successfully saved to " + outputPath);
            process.exit(0);
        });

    }, function (err) {
        console.error("Error querying database:", err);
        process.exit(1);
    });
};

setInterval(function () { }, 1000);
