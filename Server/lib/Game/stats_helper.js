var DB = require('../Web/db');
var Const = require('../const');

var RIEUL_TO_NIEUN = [4449, 4450, 4457, 4460, 4462, 4467];
var RIEUL_TO_IEUNG = [4451, 4455, 4456, 4461, 4466, 4469];
var NIEUN_TO_IEUNG = [4455, 4461, 4466, 4469];

/*
    Stats Helper
    Populates kkutu_stats table with pre-calculated word counts.
    Columns: start_0..7, end_0..7
    Index Bits: (NoLoanword << 2) | (Strict << 1) | (NoInjeong << 0)
    
    Logic Update:
    - Exclude 1-letter words.
    - Start Stats: Include Origins (Reverse Dueum).
    - End Stats: Include Targets (Forward Dueum).
*/

DB.ready = function () {
    console.log("Stats Helper: DB Ready. Starting population...");
    populateStats();
};

function populateStats() {
    var stats = {}; // Key: Char, Value: { start: [0..7], end: [0..7] }

    console.log("Fetching words from kkutu_ko...");
    DB.kkutu['ko'].find().on(function (words) {
        if (!words) {
            console.error("No words found or DB error.");
            process.exit(1);
        }

        console.log(`Processing ${words.length} words...`);

        words.forEach(function (word) {
            var w = word._id;
            var flag = word.flag || 0;
            var type = word.type || "";

            // Exclude single character words
            if (w.length <= 1) return;

            // Determine Word Properties
            var isInjeong = (flag & Const.KOR_FLAG.INJEONG) ? true : false;
            var isLoan = (flag & Const.KOR_FLAG.LOANWORD) ? true : false;
            var isStrict = (type.match(Const.KOR_STRICT) && flag < 4) ? true : false;

            // Get Start and End Chars
            var startChar = w.charAt(0);

            // Start Stats: Word starts with 'C'.
            // Include 'C' + Any Origin that converts to 'C'.
            // Example: '이' -> Include '이', '리', '니'.
            var startOriginList = getReverseDueumChars(startChar);
            startOriginList.push(startChar);

            // End Stats: Word ends with 'C' (Tail).
            // Include 'C' + Any Target that 'C' converts to.
            // Example: '리' -> Include '리', '이'.
            var endTarget = getSubChar(w.charAt(w.length - 1));
            var endList = [w.charAt(w.length - 1)];
            if (endTarget && endTarget !== w.charAt(w.length - 1)) endList.push(endTarget);

            // Update Stats for each of the 8 States
            for (var state = 0; state < 8; state++) {
                var reqNoInjeong = (state & 1);
                var reqStrict = (state & 2);
                var reqNoLoan = (state & 4);

                var valid = true;
                if (reqNoInjeong && isInjeong) valid = false;
                if (reqStrict && !isStrict) valid = false;
                if (reqNoLoan && isLoan) valid = false;

                if (valid) {
                    // Start Update
                    startOriginList.forEach(function (sc) {
                        if (!stats[sc]) stats[sc] = { start: [0, 0, 0, 0, 0, 0, 0, 0], end: [0, 0, 0, 0, 0, 0, 0, 0] };
                        stats[sc].start[state]++;
                    });

                    // End Update
                    endList.forEach(function (ec) {
                        if (!stats[ec]) stats[ec] = { start: [0, 0, 0, 0, 0, 0, 0, 0], end: [0, 0, 0, 0, 0, 0, 0, 0] };
                        stats[ec].end[state]++;
                    });
                }
            }
        });

        console.log("Aggregation done. Writing to DB...");
        saveStats(stats);
    });
}

function saveStats(stats) {
    var keys = Object.keys(stats);
    var total = keys.length;
    var current = 0;

    var createTableQuery = `
        CREATE TABLE IF NOT EXISTS kkutu_stats (
            _id VARCHAR(10) PRIMARY KEY,
            start_0 INTEGER DEFAULT 0, start_1 INTEGER DEFAULT 0, start_2 INTEGER DEFAULT 0, start_3 INTEGER DEFAULT 0,
            start_4 INTEGER DEFAULT 0, start_5 INTEGER DEFAULT 0, start_6 INTEGER DEFAULT 0, start_7 INTEGER DEFAULT 0,
            end_0 INTEGER DEFAULT 0, end_1 INTEGER DEFAULT 0, end_2 INTEGER DEFAULT 0, end_3 INTEGER DEFAULT 0,
            end_4 INTEGER DEFAULT 0, end_5 INTEGER DEFAULT 0, end_6 INTEGER DEFAULT 0, end_7 INTEGER DEFAULT 0
        );
    `;

    DB.kkutu_stats.direct(createTableQuery, function (err, res) {
        if (err) {
            console.error("Failed to create table:", err);
            process.exit(1);
        }

        console.log("Table verified throughout. Inserting data...");

        var promises = keys.map(function (key) {
            return new Promise(function (resolve, reject) {
                var d = stats[key];
                var data = {
                    _id: key,
                    start_0: d.start[0], start_1: d.start[1], start_2: d.start[2], start_3: d.start[3],
                    start_4: d.start[4], start_5: d.start[5], start_6: d.start[6], start_7: d.start[7],
                    end_0: d.end[0], end_1: d.end[1], end_2: d.end[2], end_3: d.end[3],
                    end_4: d.end[4], end_5: d.end[5], end_6: d.end[6], end_7: d.end[7]
                };

                DB.kkutu_stats.upsert(['_id', key]).set(data).on(function (res) {
                    process.stdout.write(`\rProgress: ${++current}/${total}`);
                    resolve();
                }, null, function (err) {
                    console.error(`Error saving ${key}:`, err);
                    resolve();
                });
            });
        });

        Promise.all(promises).then(function () {
            console.log("\nDone!");
            process.exit(0);
        });
    });
}

function getSubChar(char) {
    if (!char) return null;
    var r;
    var c = char.charCodeAt();
    var k;
    var ca, cb, cc;

    k = c - 0xAC00;
    if (k < 0 || k > 11171) return null;
    ca = [Math.floor(k / 28 / 21), Math.floor(k / 28) % 21, k % 28];
    cb = [ca[0] + 0x1100, ca[1] + 0x1161, ca[2] + 0x11A7];
    cc = false;
    if (cb[0] == 4357) { // ㄹ에서 ㄴ, ㅇ
        cc = true;
        if (RIEUL_TO_NIEUN.includes(cb[1])) cb[0] = 4354;
        else if (RIEUL_TO_IEUNG.includes(cb[1])) cb[0] = 4363;
        else cc = false;
    } else if (cb[0] == 4354) { // ㄴ에서 ㅇ
        if (NIEUN_TO_IEUNG.indexOf(cb[1]) != -1) {
            cb[0] = 4363;
            cc = true;
        }
    }
    if (cc) {
        cb[0] -= 0x1100; cb[1] -= 0x1161; cb[2] -= 0x11A7;
        r = String.fromCharCode(((cb[0] * 21) + cb[1]) * 28 + cb[2] + 0xAC00);
    }
    return r;
}

function getReverseDueumChars(char) {
    if (!char) return [];
    var c = char.charCodeAt() - 0xAC00;
    if (c < 0 || c > 11171) return [];
    var medial = Math.floor(c / 28) % 21;
    var initial = Math.floor(c / 28 / 21);
    var final = c % 28;

    var curInitialCode = initial + 0x1100;
    var medialCode = medial + 0x1161;
    var results = [];

    if (curInitialCode === 4354) { // ㄴ
        if (RIEUL_TO_NIEUN.includes(medialCode)) {
            results.push(String.fromCharCode(0xAC00 + (5 * 21 + medial) * 28 + final));
        }
    }
    else if (curInitialCode === 4363) { // ㅇ
        if (RIEUL_TO_IEUNG.includes(medialCode)) {
            results.push(String.fromCharCode(0xAC00 + (5 * 21 + medial) * 28 + final));
        }
        if (NIEUN_TO_IEUNG.includes(medialCode)) {
            results.push(String.fromCharCode(0xAC00 + (2 * 21 + medial) * 28 + final));
        }
    }
    return results;
}
