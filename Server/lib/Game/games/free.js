/**
 * Rule the words! KKuTu Online
 * Copyright (C) 2017 JJoriping(op@jjo.kr)
 */

var Const = require('../../const');
var Lizard = require('../../sub/lizard');
var DB;
var DIC;

const ROBOT_START_DELAY = [1200, 800, 400, 200, 0];
const ROBOT_TYPE_COEF = [1250, 750, 500, 250, 0];
const ROBOT_THINK_COEF = [4, 2, 1, 0, 0];
const ROBOT_HIT_LIMIT = [4, 3, 2, 1, 0];
const ROBOT_LENGTH_LIMIT = [3, 7, 15, 31, 999];
const ROBOT_CANDIDATE_LIMIT = [10, 20, 40, 80, 40];

exports.init = function (_DB, _DIC) {
    DB = _DB;
    DIC = _DIC;
};
exports.getTitle = function () {
    var R = new Lizard.Tail();
    var my = this;

    setTimeout(function () {
        R.go(Const.EXAMPLE_TITLE[my.rule.lang]);
    }, 100);

    return R;
};
exports.roundReady = function () {
    var my = this;

    clearTimeout(my.game.turnTimer);
    my.game.round++;
    my.game.roundTime = my.time * 1000;
    if (my.game.round <= my.round) {
        my.game.chain = [];
        if (my.opts.mission) my.game.mission = getMission(my.rule.lang);

        my.byMaster('roundReady', {
            round: my.game.round,
            mission: my.game.mission
        }, true);
        my.game.turnTimer = setTimeout(my.turnStart, 2400);
    } else {
        my.roundEnd();
    }
};
exports.turnStart = function (force) {
    var my = this;
    var speed;
    var si;

    if (!my.game.chain) return;
    my.game.roundTime = Math.min(my.game.roundTime, Math.max(10000, 150000 - my.game.chain.length * 1500));
    speed = my.getTurnSpeed(my.game.roundTime);
    clearTimeout(my.game.turnTimer);
    clearTimeout(my.game.robotTimer);
    my.game.late = false;
    my.game.turnTime = 15000 - 1400 * speed;
    my.game.turnAt = (new Date()).getTime();

    my.byMaster('turnStart', {
        turn: my.game.turn,
        speed: speed,
        roundTime: my.game.roundTime,
        turnTime: my.game.turnTime,
        mission: my.game.mission,
        seq: force ? my.game.seq : undefined
    }, true);
    my.game.turnTimer = setTimeout(my.turnEnd, Math.min(my.game.roundTime, my.game.turnTime + 100));
    if (si = my.game.seq[my.game.turn]) if (si.robot) {
        si._done = [];
        my.readyRobot(si);
    }
};
exports.turnEnd = function () {
    var my = this;
    var target;
    var score;

    if (!my.game.seq) return;
    target = DIC[my.game.seq[my.game.turn]] || my.game.seq[my.game.turn];

    if (my.game.loading) {
        my.game.turnTimer = setTimeout(my.turnEnd, 100);
        return;
    }
    clearTimeout(my.game.turnTimer);
    my.game.late = true;
    if (target) if (target.game) {
        score = Const.getPenalty(my.game.chain, target.game.score);
        target.game.score += score;
    }

    // Hint logic: Just pick a random word since there's no restriction
    getAuto.call(my, null, 0).then(function (w) {
        my.byMaster('turnEnd', {
            ok: false,
            target: target ? target.id : null,
            score: score,
            hint: w
        }, true);
        my.game._rrt = setTimeout(my.roundReady, 3000);
    });
    clearTimeout(my.game.robotTimer);
};
exports.submit = function (client, text) {
    var score, l, t;
    var my = this;
    var tv = (new Date()).getTime();
    var mgt = my.game.seq[my.game.turn];

    if (!mgt) return;
    if (!mgt.robot) if (mgt != client.id) return;

    // No chaining check needed for Free mode

    if (my.game.chain.indexOf(text) != -1) {
        if (my.opts.return) {
            // Return rule: Allow duplicate but 0 score
        } else {
            if (client.robot && client.data.candidates && client.data.candidateIndex < client.data.candidates.length - 1) {
                client.data.candidateIndex++;
                var nextWord = client.data.candidates[client.data.candidateIndex];
                if (nextWord) {
                    setTimeout(function () {
                        my.turnRobot(client, nextWord._id);
                    }, ROBOT_START_DELAY[client.level]);
                    return;
                }
            }
            client.publish('turnError', { code: 409, value: text }, true);
            if (my.opts.one) my.turnEnd();
            return;
        }
    }

    l = my.rule.lang;
    my.game.loading = true;
    function onDB($doc) {
        if (!my.game.chain) return;
        var firstMove = my.game.chain.length < 1;

        function preApproved() {
            function approved() {
                if (my.game.late) return;
                if (!my.game.chain) return;

                my.game.loading = false;
                my.game.late = true;
                clearTimeout(my.game.turnTimer);
                t = tv - my.game.turnAt;
                var isReturn = my.opts.return && my.game.chain.includes(text);
                score = my.getScore(text, t, isReturn);
                if (isReturn) score = 0;
                my.game.chain.push(text);
                my.game.roundTime -= t;
                client.game.score += score;
                client.publish('turnEnd', {
                    ok: true,
                    value: text,
                    mean: $doc.mean,
                    theme: $doc.theme,
                    wc: $doc.type,
                    score: score,
                    bonus: (my.game.mission === true) ? score - my.getScore(text, t, true) : 0,
                    baby: $doc.baby,
                    totalScore: client.game.score
                }, true);
                if (my.game.mission === true) {
                    my.game.mission = getMission(my.rule.lang);
                }
                setTimeout(my.turnNext, my.game.turnTime / 6);
                if (!client.robot) {
                    client.invokeWordPiece(text, 1);
                    DB.kkutu[l].update(['_id', text]).set(['hit', $doc.hit + 1]).on();
                }
            }
            approved();
        }
        function denied(code) {
            my.game.loading = false;
            client.publish('turnError', { code: code || 404, value: text }, true);
            if (my.opts.one) my.turnEnd();
            else if (client.robot && text.indexOf("T.T") == -1) {
                setTimeout(function () {
                    my.readyRobot(client);
                }, 1000);
            }
        }
        if (my.opts.unknown) {
            if ($doc) denied(410);
            else {
                var valid = true; //아무거나 쳐도 되므로 체크를 할 필요가 없다

                if (!valid) denied();
                else {
                    // Construct mock $doc for unknown word
                    $doc = {
                        mean: "Unknown Word",
                        theme: "",
                        type: "unknown",
                        hit: 0,
                        baby: 0,
                        flag: 0
                    };
                    preApproved();
                }
            }
        } else if ($doc) {
            if (!my.opts.injeong && ($doc.flag & Const.KOR_FLAG.INJEONG)) denied();
            else if (my.opts.strict && (!$doc.type.match(Const.KOR_STRICT) || $doc.flag >= 4)) denied(406);
            else if (my.opts.loanword && ($doc.flag & Const.KOR_FLAG.LOANWORD)) denied(405);
            else preApproved();
        } else {
            denied();
        }
    }
    DB.kkutu[l].findOne(['_id', text],
        (l == "ko") ? ['type', Const.KOR_GROUP] : ['_id', Const.ENG_ID]
    ).limit(['mean', true], ['theme', true], ['type', true], ['hit', true]).on(onDB);
};
exports.getScore = function (text, delay, ignoreMission) {
    var my = this;
    var tr = 1 - delay / my.game.turnTime;
    var score, arr;

    if (!text || !my.game.chain) return 0;
    score = Const.getPreScore(text, my.game.chain, tr);

    if (!ignoreMission) if (arr = text.match(new RegExp(my.game.mission, "g"))) {
        score += score * 0.5 * arr.length;
        my.game.mission = true;
    }
    return Math.round(score);
};
exports.readyRobot = function (robot) {
    var my = this;
    var level = robot.level;
    var delay = ROBOT_START_DELAY[level];
    var w, text, i;

    // Strategy 3: Unknown O
    if (my.opts.unknown) {
        var gen = "";
        var len;
        var usePreferred = false;
        var preferredChar = robot.data.preferredChar;

        // Check if preferredChar matches the game language
        if (preferredChar) {
            if (my.rule.lang == "ko" && /[가-힣]/.test(preferredChar)) usePreferred = true;
            else if (my.rule.lang == "en" && /[a-zA-Z]/.test(preferredChar)) usePreferred = true;
        }

        // Random length based on level
        switch (level) {
            case 0: len = Math.floor(Math.random() * 2) + 1; break; // 1~2
            case 1: len = Math.floor(Math.random() * 3) + 2; break; // 2~4
            case 2: len = Math.floor(Math.random() * 5) + 4; break; // 4~8
            case 3: len = Math.floor(Math.random() * 9) + 8; break; // 8~16
            case 4: len = Math.floor(Math.random() * 17) + 16; break; // 16~32
            default: len = Math.floor(Math.random() * 5) + 2; break;
        }

        if (my.game.mission) {
            // Mission O: Repeat mission char
            for (i = 0; i < len; i++) {
                gen += my.game.mission;
            }
        } else {
            // Mission X: Random chars
            for (i = 0; i < len; i++) {
                var forceChar = false;
                if (usePreferred && i === len - 1) forceChar = true;

                if (forceChar) {
                    gen += preferredChar;
                } else {
                    if (my.rule.lang == "ko") {
                        gen += String.fromCharCode(0xAC00 + Math.floor(Math.random() * 11172));
                    } else {
                        gen += String.fromCharCode(97 + Math.floor(Math.random() * 26));
                    }
                }
            }
        }

        text = gen;
        delay += 400;
        after();
        return;
    }

    // Strategy 1 & 2: Mission X/O, Unknown X
    getAuto.call(my, null, 2).then(function (list) {
        if (list.length) {
            // Filter by mission if active (Strategy 2)
            if (my.game.mission) {
                var missionList = list.filter(function (item) {
                    return item._id.includes(my.game.mission);
                });
                if (missionList.length > 0) {
                    list = missionList;
                }
            }

            // Sort by length (Long words first)
            list.sort(function (a, b) { return b._id.length - a._id.length; });

            // Add some randomness based on level to avoid always picking the longest
            if (level < 4) {
                list = list.slice(0, Math.min(list.length, ROBOT_CANDIDATE_LIMIT[level])); // Take top N
                list = shuffle(list); // Shuffle them
            }

            pickList(list);
        } else denied();
    });

    function denied() {
        text = Const.ROBOT_DEFEAT_MESSAGES_2[Math.floor(Math.random() * Const.ROBOT_DEFEAT_MESSAGES_2.length)];
        after();
    }
    function pickList(list) {
        if (list) do {
            if (!(w = list.shift())) break;
        } while (w._id.length > ROBOT_LENGTH_LIMIT[level] || robot._done.includes(w._id));
        if (w) {
            robot.data.candidates = [w].concat(list);
            robot.data.candidateIndex = 0;
            text = w._id;
            delay += 500 * ROBOT_THINK_COEF[level] * Math.random() / Math.log(1.1 + w.hit);
            after();
        } else denied();
    }
    function after() {
        delay += text.length * ROBOT_TYPE_COEF[level];
        robot._done.push(text);
        setTimeout(my.turnRobot, delay, robot, text);
    }
};
function getMission(l) {
    var arr = (l == "ko") ? Const.MISSION_ko : Const.MISSION_en;

    if (!arr) return "-";
    return arr[Math.floor(Math.random() * arr.length)];
}
function getAuto(char, type) {
    // char is ignored in Free mode
    var my = this;
    var R = new Lizard.Tail();
    var bool = type == 1;

    var aqs = [];
    var aft;
    var raiser;

    if (!my.opts.injeong) aqs.push(['flag', { '$nand': Const.KOR_FLAG.INJEONG }]);
    if (my.rule.lang == "ko") {
        if (my.opts.loanword) aqs.push(['flag', { '$nand': Const.KOR_FLAG.LOANWORD }]);
        if (my.opts.strict) aqs.push(['type', Const.KOR_STRICT], ['flag', { $lte: 3 }]);
        else aqs.push(['type', Const.KOR_GROUP]);
    } else {
        aqs.push(['_id', Const.ENG_ID]);
    }

    // In Free mode, we just want *any* word. 
    // But for 'getAuto' type 2 (list), we might want a random selection or sorted by length.
    // Since we can't fetch ALL words, we'll fetch a random subset or use a regex to get a variety.
    // Actually, fetching *any* word efficiently is tricky if we just do find({}).
    // Let's try to fetch words starting with a random character to distribute load.

    if (type === 2) {
        // For bot list, pick a random start char to get a variety of words
        var randomStart;
        if (my.rule.lang == "ko") {
            randomStart = String.fromCharCode(0xAC00 + Math.floor(Math.random() * 11172));
        } else {
            randomStart = String.fromCharCode(97 + Math.floor(Math.random() * 26));
        }
        // Use regex to find words starting with or containing this char?
        // Just finding words starting with a random char is good enough distribution.
        // Or even better, just find({}) with limit and skip? Skip is slow.
        // Let's stick to random start char for now.
        // Actually, let's just use a regex that matches anything but starts with a random char range.

        // To ensure we get long words, maybe we don't restrict too much.
        // Let's try to get words that are reasonably long?
        // DB queries in this codebase seem to rely on regex.

        // Let's try to find words starting with a random syllable.
        var ja = 44032 + 588 * Math.floor(Math.random() * 19); // Random initial consonant group
        var range = `[\\u${ja.toString(16)}-\\u${(ja + 587).toString(16)}]`;
        aqs.push(['_id', new RegExp(`^${range}`)]);
    }

    switch (type) {
        case 0:
        default:
            aft = function ($md) {
                R.go($md[Math.floor(Math.random() * $md.length)]);
            };
            break;
        case 1:
            aft = function ($md) {
                R.go($md.length ? true : false);
            };
            break;
        case 2:
            aft = function ($md) {
                R.go($md);
            };
            break;
    }

    DB.kkutu[my.rule.lang].find.apply(this, aqs).limit(bool ? 1 : 100).on(function ($md) {
        if (my.game.chain) aft($md.filter(function (item) { return !my.game.chain.includes(item); }));
        else aft($md);
    });

    return R;
}
function shuffle(arr) {
    var i, r = [];

    for (i in arr) r.push(arr[i]);
    r.sort(function (a, b) { return Math.random() - 0.5; });

    return r;
}
