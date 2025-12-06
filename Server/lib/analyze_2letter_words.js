
var DB = require('./Web/db');
var Const = require('./const');

console.log("Initializing...");

// Override DB.ready to execute our logic once connected
DB.ready = function (Redis, Pg) {
    console.log("DB Connected. Starting analysis...");

    // Query for all 2-letter words in Korean dictionary
    // We use regex /^..$/ to match exactly 2 characters
    // We filter by type to ensure valid words (using Const.KOR_GROUP which is standard)

    // Pass conditions as separate arguments to find()
    DB.kkutu['ko'].find(
        ['_id', /^..$/],
        ['type', Const.KOR_GROUP]
    ).on(function (words) {
        console.log("Found " + words.length + " 2-letter words.");

        var counts = {};
        words.forEach(function (w) {
            var first = w._id.charAt(0);
            counts[first] = (counts[first] || 0) + 1;
        });

        // Sort by count descending
        var sorted = Object.keys(counts).sort(function (a, b) {
            return counts[b] - counts[a];
        });

        console.log("\nTop syllables with most 2-letter words:");
        sorted.slice(0, 50).forEach(function (s, index) {
            console.log((index + 1) + ". " + s + ": " + counts[s]);
        });

        console.log("\nAnalysis complete.");
        process.exit(0);
    }, function (err) {
        console.error("Error querying database:", err);
        process.exit(1);
    });
};

// Keep the process alive until DB connects
setInterval(function () { }, 1000);
