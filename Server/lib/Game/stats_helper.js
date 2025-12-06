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

            // Determine Word Properties
            var isInjeong = (flag & Const.KOR_FLAG.INJEONG) ? true : false;
            var isLoan = (flag & Const.KOR_FLAG.LOANWORD) ? true : false;
            var isStrict = (type.match(Const.KOR_STRICT) && flag < 4) ? true : false;
            // Strict Definition from classic.js: (!type.match(Const.KOR_STRICT) || flag >= 4) -> Denied
            // So Valid Strict = Match Strict AND Flag < 4.

            // Get Start and End Chars
            var startChar = w.charAt(0);
            var endChars = getReverseDueumChars(w.charAt(w.length - 1));
            endChars.push(w.charAt(w.length - 1)); // Include original tail

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
                    if (!stats[startChar]) stats[startChar] = { start: [0, 0, 0, 0, 0, 0, 0, 0], end: [0, 0, 0, 0, 0, 0, 0, 0] };
                    stats[startChar].start[state]++;

                    // End Update (handle potential multi-tail due to Reverse Dueum in KAP)
                    // Note: In standard game, we just check if Head matches tail.
                    // But for KAP (Reverse), Bot attacks with HEAD, Opponent matches TAIL.
                    // So "End Count" here represents "How many words END with this char?" (Normal Game next word count)
                    // Actually, wait.
                    // CountNextWords logic:
                    // Normal Game (Bot attacks with Tail): Count words STARTING with Tail. -> Query 'start_X' of Tail.
                    // KAP Game (Bot attacks with Head): Count words ENDING with (Head or RevDueum(Head)). -> Query 'end_X' of Head.

                    endChars.forEach(function (ec) {
                        if (!stats[ec]) stats[ec] = { start: [0, 0, 0, 0, 0, 0, 0, 0], end: [0, 0, 0, 0, 0, 0, 0, 0] };
                        // Avoid double counting if Reverse Dueum result is same as original (unlikely but safe)
                        // Actually endChars includes original.
                        // Stats structure: Key is the 'query char'.
                        // If I have word '기러기', it ends in '기'. 
                        // Someone attacking with '기' in KAP needs to find words ending in '기'.
                        // So '기' end_count increments.
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

    // Chunking to avoid overwhelming DB? 
    // Or just one by one. There are about 2000-3000 distinct chars maybe? 11172 max.
    // Let's optimize by creating table first if not exists. 

    // We assume table exists from db.js definition, but columns might not match if we just did 'new Table'.
    // `collection.js` doesn't auto-create schema. We might need to CREATE TABLE manually or assume `db.sql` handles it?
    // User said "Initialize KKuTu Database" before, `db.sql` was executed.
    // `kkutu_stats` is NEW. It probably doesn't verify schema in `db.js`.
    // I should create the table using raw query if possible, or just rely on 'upsert' if table exists.
    // Wait, `collection.js` `upsert` does `INSERT ... ON CONFLICT DO UPDATE`. 
    // If table doesn't exist, it will fail.

    // I'll add a check to create table if not exists.

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

        // Use Promise loop for sequence or Parallel? Parallel is faster.
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
                    resolve(); // Continue even if error
                });
            });
        });

        Promise.all(promises).then(function () {
            console.log("\nDone!");
            process.exit(0);
        });
    });
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
