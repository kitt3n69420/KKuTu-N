var DB = require('../Web/db');
var Const = require('../const');

var RIEUL_TO_NIEUN = [4449, 4450, 4457, 4460, 4462, 4467];
var RIEUL_TO_IEUNG = [4451, 4455, 4456, 4461, 4466, 4469];
var NIEUN_TO_IEUNG = [4455, 4461, 4466, 4469];


DB.ready = function () {
    console.log("Stats Helper: DB Ready. Starting population...");
    populateStats();
};

function populateStats() {
    // Key: Char, Value: { start: [0..15], end: [0..15] }
    // States 0-7: 기본 두음법칙 (모음 조건 적용)
    // States 8-15: 자유 두음법칙 (모음 조건 무시)
    var stats = {};
    var langs = ['ko', 'en'];
    var pending = langs.length;

    langs.forEach(function (lang) {
        console.log(`Fetching words from kkutu_${lang}...`);
        DB.kkutu[lang].find().on(function (words) {
            if (!words) {
                console.error(`No words found for ${lang} or DB error.`);
                if (--pending === 0) finalize();
                return;
            }

            console.log(`Processing ${words.length} words for ${lang}...`);

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

                var startOriginList = [];
                var startOriginListFree = []; // 자유 두음법칙용 (역방향)
                var endList = [];
                var endListFree = []; // 자유 두음법칙용

                if (lang === 'ko') {
                    // Korean Logic
                    var startChar = w.charAt(0);
                    var endChar = w.charAt(w.length - 1);

                    // 기본 두음법칙 (모음 조건 적용)
                    startOriginList = getReverseDueumChars(startChar);
                    startOriginList.push(startChar);

                    var endTarget = getSubChar(endChar);
                    endList.push(endChar);
                    if (endTarget && endTarget !== endChar) endList.push(endTarget);

                    // 자유 두음법칙 (모음 조건 무시)
                    startOriginListFree = getReverseDueumCharsFree(startChar);
                    startOriginListFree.push(startChar);

                    var endTargetsFree = getSubCharFree(endChar);
                    endListFree.push(endChar);
                    endTargetsFree.forEach(function (ec) {
                        if (ec !== endChar && endListFree.indexOf(ec) === -1) endListFree.push(ec);
                    });
                } else {
                    // English Logic - no freeDueum concept
                    if (w.length >= 2) startOriginList.push(w.slice(0, 2));
                    if (w.length >= 3) startOriginList.push(w.slice(0, 3));

                    if (w.length >= 2) endList.push(w.slice(-2));
                    if (w.length >= 3) endList.push(w.slice(-3));

                    // 영어는 자유 두음 없음 - 빈 배열로 처리 (값은 0으로 유지)
                    startOriginListFree = [];
                    endListFree = [];
                }

                // Update Stats for each of the 16 States
                for (var state = 0; state < 16; state++) {
                    var reqNoInjeong = (state & 1);
                    var reqStrict = (state & 2);
                    var reqNoLoan = (state & 4);
                    var isFreeDueum = (state & 8); // bit 3 = freeDueum

                    var valid = true;
                    if (reqNoInjeong && isInjeong) valid = false;
                    if (reqStrict && !isStrict) valid = false;
                    if (reqNoLoan && isLoan) valid = false;

                    if (valid) {
                        // 자유 두음 적용 시 다른 리스트 사용
                        var startList = isFreeDueum ? startOriginListFree : startOriginList;
                        var endListToUse = isFreeDueum ? endListFree : endList;

                        // 영어의 경우 freeDueum 상태에서 빈 리스트이므로 아무것도 추가되지 않음
                        // -> 결과적으로 state 8-15는 영어에서 0 유지

                        // Start Update
                        startList.forEach(function (sc) {
                            if (!stats[sc]) stats[sc] = createEmptyStats();
                            stats[sc].start[state]++;
                        });

                        // End Update
                        endListToUse.forEach(function (ec) {
                            if (!stats[ec]) stats[ec] = createEmptyStats();
                            stats[ec].end[state]++;
                        });
                    }
                }
            });

            if (--pending === 0) finalize();
        });
    });

    function finalize() {
        console.log("Aggregation done. Writing to DB...");
        saveStats(stats);
    }
}

function createEmptyStats() {
    return {
        start: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        end: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    };
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
            start_8 INTEGER DEFAULT 0, start_9 INTEGER DEFAULT 0, start_10 INTEGER DEFAULT 0, start_11 INTEGER DEFAULT 0,
            start_12 INTEGER DEFAULT 0, start_13 INTEGER DEFAULT 0, start_14 INTEGER DEFAULT 0, start_15 INTEGER DEFAULT 0,
            end_0 INTEGER DEFAULT 0, end_1 INTEGER DEFAULT 0, end_2 INTEGER DEFAULT 0, end_3 INTEGER DEFAULT 0,
            end_4 INTEGER DEFAULT 0, end_5 INTEGER DEFAULT 0, end_6 INTEGER DEFAULT 0, end_7 INTEGER DEFAULT 0,
            end_8 INTEGER DEFAULT 0, end_9 INTEGER DEFAULT 0, end_10 INTEGER DEFAULT 0, end_11 INTEGER DEFAULT 0,
            end_12 INTEGER DEFAULT 0, end_13 INTEGER DEFAULT 0, end_14 INTEGER DEFAULT 0, end_15 INTEGER DEFAULT 0
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
                    start_8: d.start[8], start_9: d.start[9], start_10: d.start[10], start_11: d.start[11],
                    start_12: d.start[12], start_13: d.start[13], start_14: d.start[14], start_15: d.start[15],
                    end_0: d.end[0], end_1: d.end[1], end_2: d.end[2], end_3: d.end[3],
                    end_4: d.end[4], end_5: d.end[5], end_6: d.end[6], end_7: d.end[7],
                    end_8: d.end[8], end_9: d.end[9], end_10: d.end[10], end_11: d.end[11],
                    end_12: d.end[12], end_13: d.end[13], end_14: d.end[14], end_15: d.end[15]
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

// 기본 두음법칙 (모음 조건 적용) - 단일 문자 반환
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

// 자유 두음법칙 (모음 조건 무시) - 배열 반환
// 끝말잇기용: ㄹ→ㄴ,ㅇ / ㄴ→ㅇ
function getSubCharFree(char) {
    if (!char) return [];
    var c = char.charCodeAt();
    var k = c - 0xAC00;
    if (k < 0 || k > 11171) return [];

    var ca = [Math.floor(k / 28 / 21), Math.floor(k / 28) % 21, k % 28];
    var cb = [ca[0] + 0x1100, ca[1] + 0x1161, ca[2] + 0x11A7];
    var results = [];

    function buildChar(initial, medial, final) {
        return String.fromCharCode(((initial * 21) + medial) * 28 + final + 0xAC00);
    }

    // ㄹ(5, 4357) → ㄴ(2), ㅇ(11)
    if (cb[0] === 4357) {
        results.push(buildChar(2, ca[1], ca[2]));   // ㄴ
        results.push(buildChar(11, ca[1], ca[2]));  // ㅇ
    }
    // ㄴ(2, 4354) → ㅇ(11)
    else if (cb[0] === 4354) {
        results.push(buildChar(11, ca[1], ca[2]));  // ㅇ
    }

    return results;
}

// 기본 역두음법칙 (모음 조건 적용): ㄴ→ㄹ, ㅇ→ㄹ,ㄴ (앞말잇기 등)
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

// 자유 역두음법칙 (모음 조건 무시): ㄴ→ㄹ, ㅇ→ㄴ,ㄹ (앞말잇기 자유두음)
function getReverseDueumCharsFree(char) {
    if (!char) return [];
    var c = char.charCodeAt() - 0xAC00;
    if (c < 0 || c > 11171) return [];
    var medial = Math.floor(c / 28) % 21;
    var initial = Math.floor(c / 28 / 21);
    var final = c % 28;

    var curInitialCode = initial + 0x1100;
    var results = [];

    function buildChar(initIdx, med, fin) {
        return String.fromCharCode(0xAC00 + (initIdx * 21 + med) * 28 + fin);
    }

    // ㄴ(2, 4354) → ㄹ(5)
    if (curInitialCode === 4354) {
        results.push(buildChar(5, medial, final)); // ㄹ
    }
    // ㅇ(11, 4363) → ㄴ(2), ㄹ(5)
    else if (curInitialCode === 4363) {
        results.push(buildChar(2, medial, final));  // ㄴ
        results.push(buildChar(5, medial, final));  // ㄹ
    }

    return results;
}
