/**
 * Rule the words! KKuTu Online
 * Copyright (C) 2017 JJoriping(op@jjo.kr)
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

var Const = require('../../const');
var Lizard = require('../../sub/lizard');
var DB;
var DIC;

const ROBOT_START_DELAY = [1200, 800, 400, 200, 0];
const ROBOT_TYPE_COEF = [1250, 750, 500, 250, 0];
const ROBOT_THINK_COEF = [4, 2, 1, 0, 0];
const ROBOT_HIT_LIMIT = [4, 3, 2, 1, 0];
const ROBOT_LENGTH_LIMIT = [3, 6, 12, 24, 999];
const ROBOT_CANDIDATE_LIMIT = [10, 20, 40, 80, 40];
const SPECIAL_MOVE_PROB = [0, 0, 0.1, 0.25, 0.4];
const PERSONALITY_CONST = [0, 0, 0.5, 0.8, 0.99];
const PREFERRED_CHAR_PROB = [0.6, 0.7, 0.8, 0.9, 1.0];
const RIEUL_TO_NIEUN = [4449, 4450, 4457, 4460, 4462, 4467];
const RIEUL_TO_IEUNG = [4451, 4455, 4456, 4461, 4466, 4469];
const NIEUN_TO_IEUNG = [4455, 4461, 4466, 4469];


exports.init = function (_DB, _DIC) {
	DB = _DB;
	DIC = _DIC;
};
exports.getTitle = function () {
	var R = new Lizard.Tail();
	var my = this;
	var l = my.rule;
	var EXAMPLE;
	var eng, ja;

	if (!l) {
		R.go("undefinedd");
		return R;
	}
	if (!l.lang) {
		R.go("undefinedd");
		return R;
	}
	EXAMPLE = Const.EXAMPLE_TITLE[l.lang];
	my.game.dic = {};

	switch (Const.GAME_TYPE[my.mode]) {
		case 'EKK':
			my.game.wordLength = 5;
		case 'EKT':
		case 'ESH':
			eng = "^" + String.fromCharCode(97 + Math.floor(Math.random() * 26));
			break;
		case 'KKT':
			my.game.wordLength = 3;
		case 'KSH':
			ja = 44032 + 588 * Math.floor(Math.random() * 18);
			eng = "^[\\u" + ja.toString(16) + "-\\u" + (ja + 587).toString(16) + "]";
			break;
		case 'KAP':
			ja = 44032 + 588 * Math.floor(Math.random() * 18);
			eng = "[\\u" + ja.toString(16) + "-\\u" + (ja + 587).toString(16) + "]$";
			break;
	}
	function tryTitle(h) {
		if (h > 50) {
			R.go(EXAMPLE);
			return;
		}
		DB.kkutu[l.lang].find(
			['_id', new RegExp(eng + ".{" + Math.max(1, my.round - 1) + "}$")],
			// [ 'hit', { '$lte': h } ],
			(l.lang == "ko") ? ['type', Const.KOR_GROUP] : ['_id', Const.ENG_ID]
			// '$where', eng+"this._id.length == " + Math.max(2, my.round) + " && this.hit <= " + h
		).limit(20).on(function ($md) {
			var list;

			if ($md.length) {
				list = shuffle($md);
				checkTitle(list.shift()._id).then(onChecked);

				function onChecked(v) {
					if (v) R.go(v);
					else if (list.length) checkTitle(list.shift()._id).then(onChecked);
					else R.go(EXAMPLE);
				}
			} else {
				tryTitle(h + 10);
			}
		});
	}
	function checkTitle(title) {
		var R = new Lizard.Tail();
		var i, list = [];
		var len;

		/* 부하가 너무 걸린다면 주석을 풀자.
		R.go(true);
		return R;
		*/
		if (title == null) {
			R.go(EXAMPLE);
		} else {
			len = title.length;
			for (i = 0; i < len; i++) list.push(getAuto.call(my, title[i], getSubChar.call(my, title[i]), 1));

			Lizard.all(list).then(function (res) {
				for (i in res) if (!res[i]) return R.go(EXAMPLE);

				return R.go(title);
			});
		}
		return R;
	}
	tryTitle(10);

	return R;
};
exports.roundReady = function () {
	var my = this;
	if (!my.game.title) return;

	clearTimeout(my.game.turnTimer);
	my.game.round++;
	my.game.roundTime = my.time * 1000;
	if (my.game.round <= my.round) {
		my.game.char = my.game.title[my.game.round - 1];
		my.game.subChar = getSubChar.call(my, my.game.char);
		my.game.chain = [];
		if (my.opts.mission) my.game.mission = getMission(my.rule.lang);
		if (my.opts.sami) {
			my.game.wordLength = 2;
			my.game.samiCount = 0;
		}

		my.byMaster('roundReady', {
			round: my.game.round,
			char: my.game.char,
			subChar: my.game.subChar,
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
	if (my.opts.sami) {
		var n = my.game.seq.length;
		if (n % 2 !== 0) {
			my.game.wordLength = (my.game.wordLength == 3) ? 2 : 3;
		} else {
			if (typeof my.game.samiCount === 'undefined') my.game.samiCount = 0;
			var idx = my.game.samiCount % (n + 1);
			my.game.wordLength = (idx % 2 === 0) ? 3 : 2;
			my.game.samiCount++;
		}
	}

	my.byMaster('turnStart', {
		turn: my.game.turn,
		char: my.game.char,
		subChar: my.game.subChar,
		speed: speed,
		roundTime: my.game.roundTime,
		turnTime: my.game.turnTime,
		mission: my.game.mission,
		wordLength: my.game.wordLength,
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
	getAuto.call(my, my.game.char, my.game.subChar, 0).then(function (w) {
		my.byMaster('turnEnd', {
			ok: false,
			target: target ? target.id : null,
			score: score,
			hint: w
		}, true);

		// Bot timeout message logic
		if (target && my.game.seq) {
			var bots = [];
			var i, p, item;
			var targetId = (typeof target === 'object') ? target.id : target;

			console.log("[DEBUG] TurnEnd Timeout: targetId=" + targetId);
			// if (!Const.ROBOT_TIMEOUT_MESSAGES) console.error("[ERROR] ROBOT_TIMEOUT_MESSAGES is undefined!");

			for (i in my.game.seq) {
				item = my.game.seq[i];
				if (typeof item === 'string') {
					p = DIC[item];
				} else {
					p = item;
				}

				if (p && p.robot) {
					console.log("[DEBUG] Found bot: " + p.id + " (Target: " + targetId + ")");
					if (p.id !== targetId) {
						bots.push(p);
					}
				}
			}

			// console.log("[DEBUG] Candidate bots count: " + bots.length);

			if (bots.length > 0) {
				var prob = 0.5 / bots.length;
				// console.log("[DEBUG] Probability per bot: " + prob);
				for (i in bots) {
					var rand = Math.random();
					// console.log("[DEBUG] Bot " + bots[i].id + " roll: " + rand + " vs " + prob);
					if (rand < prob) {
						(function (bot) {
							// console.log("[DEBUG] Scheduling message for bot " + bot.id);
							setTimeout(function () {
								var msg = Const.ROBOT_TIMEOUT_MESSAGES[Math.floor(Math.random() * Const.ROBOT_TIMEOUT_MESSAGES.length)];
								// console.log("[DEBUG] Bot " + bot.id + " saying: " + msg);
								bot.chat(msg);
							}, 500 + Math.random() * 1000);
						})(bots[i]);
					}
				}
			}
		}

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
	if (!my.game.char) return;

	if (!isChainable(text, my.mode, my.game.char, my.game.subChar)) return client.chat(text);
	if (my.game.chain.indexOf(text) != -1) {
		if (my.opts.return) {
			// Return rule: Allow duplicate but 0 score
		} else {
			if (client.robot && client.data.candidates && client.data.candidateIndex < client.data.candidates.length - 1) {
				client.data.candidateIndex++;
				var nextWord = client.data.candidates[client.data.candidateIndex];
				setTimeout(function () {
					my.turnRobot(client, nextWord._id);
				}, ROBOT_START_DELAY[client.level]);
				return;
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
		var preChar = getChar.call(my, text);
		var preSubChar = getSubChar.call(my, preChar);
		var firstMove = my.game.chain.length < 1;

		function preApproved() {
			function approved() {
				if (my.game.late) return;
				if (!my.game.chain) return;
				if (!my.game.dic) return;

				my.game.loading = false;
				my.game.late = true;
				clearTimeout(my.game.turnTimer);
				t = tv - my.game.turnAt;
				var isReturn = my.opts.return && my.game.chain.includes(text);
				score = my.getScore(text, t, isReturn);
				if (isReturn) score = 0;
				my.game.dic[text] = (my.game.dic[text] || 0) + 1;
				my.game.chain.push(text);
				my.game.roundTime -= t;
				my.game.char = preChar;
				my.game.subChar = preSubChar;
				client.game.score += score;
				client.publish('turnEnd', {
					ok: true,
					value: text,
					mean: $doc.mean,
					theme: $doc.theme,
					wc: $doc.type,
					score: score,
					bonus: (my.game.mission === true) ? score - my.getScore(text, t, true) : 0,
					baby: $doc.baby
				}, true);
				if (my.game.mission === true) {
					my.game.mission = getMission(my.rule.lang);
				}
				setTimeout(my.turnNext, my.game.turnTime / 6);
				if (!client.robot) {
					client.invokeWordPiece(text, 1);
					DB.kkutu[l].update(['_id', text]).set(['hit', $doc.hit + 1]).on();
				} else {
					getAuto.call(my, my.game.char, my.game.subChar, 1).then(function (w) {
						if (!w) {
							setTimeout(function () {
								if (!my.opts.unknown) client.chat(Const.ROBOT_VICTORY_MESSAGES[Math.floor(Math.random() * Const.ROBOT_VICTORY_MESSAGES.length)]);
							}, 500);
						}
					});
				}
			}
			if ((firstMove || my.opts.manner) && !my.opts.unknown) getAuto.call(my, preChar, preSubChar, 1).then(function (w) {
				if (w) approved();
				else {
					my.game.loading = false;
					client.publish('turnError', { code: firstMove ? 402 : 403, value: text }, true);
					if (client.robot) {
						my.readyRobot(client);
					}
					if (my.opts.one) my.turnEnd();
				}
			});
			else approved();
		}
		function denied(code) {
			my.game.loading = false;
			client.publish('turnError', { code: code || 404, value: text }, true);
			if (my.opts.one) my.turnEnd();
			else if (client.robot && text.indexOf("T.T") == -1 && !Const.ROBOT_DEFEAT_MESSAGES.includes(text) && text.indexOf("..") == -1 && text.indexOf("??") == -1 && !(text.length === 3 && text[0] === text[1] && text[1] === text[2])) {
				setTimeout(function () {
					my.readyRobot(client);
				}, 1000);
			}
		}
		if (my.opts.unknown) {
			if ($doc) denied(410);
			else {
				var valid = true;
				if (my.opts.manner) {
					if (my.rule.lang == "ko") {
						if (!preChar.match(/[가-힣ㄱ-ㅎㅏ-ㅣ0-9]/)) valid = false;
					} else {
						if (!preChar.match(/[a-zA-Z0-9]/)) valid = false;
					}
				}

				if (!valid) denied();
				else {
					// Construct mock $doc for unknown word
					$doc = {
						mean: "언노운 워드",
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
	function isChainable() {
		var type = Const.GAME_TYPE[my.mode];
		var char = my.game.char, subChar = my.game.subChar;
		var l = char.length;

		if (!text) return false;
		if (text.length <= l) return false;
		if (my.game.wordLength && text.length != my.game.wordLength) return false;
		if (type == "KAP") return (text.slice(-1) == char) || (text.slice(-1) == subChar);

		if (text.indexOf(char) === 0) return true;
		if (subChar && text.indexOf(subChar) === 0) return true;

		return false;
	}
	DB.kkutu[l].findOne(['_id', text],
		(l == "ko") ? ['type', Const.KOR_GROUP] : ['_id', Const.ENG_ID]
	).limit(['mean', true], ['theme', true], ['type', true], ['hit', true], ['flag', true]).on(onDB);
};
exports.getScore = function (text, delay, ignoreMission) {
	var my = this;
	var tr = 1 - delay / my.game.turnTime;
	var score, arr;

	if (!text || !my.game.chain || !my.game.dic) return 0;
	score = Const.getPreScore(text, my.game.chain, tr);

	if (my.game.dic[text]) score *= 15 / (my.game.dic[text] + 15);
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
	var ended = {};
	var w, text, i;
	var lmax;
	var isRev = Const.GAME_TYPE[my.mode] == "KAP";
	var personality = robot.data.personality || 0;
	var preferredChar = robot.data.preferredChar;

	console.log(`[BOT] readyRobot: Level=${level}, Personality=${personality}, PrefChar=${preferredChar}, Mode=${Const.GAME_TYPE[my.mode]}`);

	// Helper: Count next words for a given character
	// Helper: Count next words for a given character using Pre-calculated Stats
	function countNextWords(char) {
		return new Promise(function (resolve, reject) {
			if (!char || char.length > 1) return resolve(0); // Only single char supported for stats

			// Determine State Index (0-7)
			var state = 0;
			// Bit 0: No Injeong (If Opts Injeong is OFF, then we are in No Injeong mode)
			// Wait, logic in helper:
			// reqNoInjeong (Bit 0): If Set, reject if is_injeong.
			// Default game: opts.injeong = false?
			// Let's check 'keyByOptions' in classic.js or similar.
			// Const.js: 'ext' : { name: "Injeong" }
			// If my.opts.injeong is TRUE, we ALLOW Injeong. So reqNoInjeong should be 0.
			// If my.opts.injeong is FALSE, we DISALLOW Injeong. So reqNoInjeong should be 1.
			if (!my.opts.injeong) state |= 1;

			// Bit 1: Strict (If Opts Strict is ON, we REQUIRE Strict)
			if (my.opts.strict) state |= 2;

			// Bit 2: No Loanword (If Opts Loanword is ON, we FORBID Loanword)
			// Const.js: 'loa' : { name: "Loanword" } -> Usually "Forbidden Loanword" rule?
			// Let's re-read db.js or classic.js usage.
			// Line 414: else if (my.opts.loanword && ($doc.flag & Const.KOR_FLAG.LOANWORD)) denied(405);
			// So if opts.loanword is TRUE, we DENY loanwords.
			if (my.opts.loanword) state |= 4;

			var col = isRev ? `end_${state}` : `start_${state}`;

			DB.kkutu_stats.findOne(['_id', char]).on(function (doc) {
				if (doc) {
					resolve(doc[col] || 0);
				} else {
					resolve(0);
				}
			}, null, function (err) {
				console.error("[BOT] countNextWords Error:", err);
				resolve(0);
			});
		});
	}

	if (my.opts.unknown) {
		var gen = "";
		var len;
		var pool = [];
		var usePreferred = false;

		// Check if preferredChar matches the game language
		if (preferredChar) {
			if (my.rule.lang == "ko" && /[가-힣]/.test(preferredChar)) usePreferred = true;
			else if (my.rule.lang == "en" && /[a-zA-Z]/.test(preferredChar)) usePreferred = true;
		}

		if (Const.GAME_TYPE[my.mode] == "KKT" || Const.GAME_TYPE[my.mode] == "EKK") {
			len = my.game.wordLength - 1;
		} else {
			switch (level) {
				case 0: len = Math.floor(Math.random() * 2) + 1; break; // 1~2
				case 1: len = Math.floor(Math.random() * 3) + 2; break; // 2~4
				case 2: len = Math.floor(Math.random() * 5) + 4; break; // 4~8
				case 3: len = Math.floor(Math.random() * 9) + 8; break; // 8~16
				case 4: len = Math.floor(Math.random() * 17) + 16; break; // 16~32
				default: len = Math.floor(Math.random() * 5) + 2; break;
			}
		}

		if (my.game.mission) {
			// Mission active: use current mission char(s)
			pool = [my.game.mission];
		}

		for (i = 0; i < len; i++) {
			var usePool = pool.length > 0;
			if ((Const.GAME_TYPE[my.mode] == "KKT" || Const.GAME_TYPE[my.mode] == "EKK") && i >= len - 1) usePool = false;

			// Determine if we should force preferred char
			// Normal: Last char of 'gen' (which becomes last char of word)
			// Reverse: First char of 'gen' (which becomes first char of word)
			var forceChar = false;
			if (usePreferred) {
				if (isRev) {
					if (i === 0) forceChar = true;
				} else {
					if (i === len - 1) forceChar = true;
				}
			}

			if (forceChar) {
				gen += preferredChar;
			} else if (usePool) {
				gen += pool[Math.floor(Math.random() * pool.length)];
			} else {
				if (my.rule.lang == "ko") {
					gen += String.fromCharCode(0xAC00 + Math.floor(Math.random() * 11172));
				} else {
					gen += String.fromCharCode(97 + Math.floor(Math.random() * 26));
				}
			}
		}

		if (isRev) text = gen + my.game.char;
		else text = my.game.char + gen;

		delay += 400; // Basic delay
		after();
		return;
	}

	// Priority 1: Preferred Character Logic (Direct Query)
	if (preferredChar && Math.random() < PREFERRED_CHAR_PROB[level]) {
		var proceed = Promise.resolve(true);

		// Safety Check: On the first turn, ensure the preferred char doesn't lead to a dead end
		if (my.game.chain.length === 0) {
			proceed = countNextWords(preferredChar).then(function (count) {
				if (count === 0) {
					console.log(`[BOT] Skipping Preferred Char '${preferredChar}' on first turn (No next words)`);
					return false;
				}
				return true;
			});
		}

		proceed.then(function (canUse) {
			if (!canUse) {
				decideStrategy();
				return;
			}

			console.log(`[BOT] Priority 1: Trying Preferred Char: ${preferredChar}`);


			var adc = my.game.char + (my.game.subChar ? ("|" + my.game.subChar) : "");
			var regex;

			// Dynamic Regex Construction for Gaon/Second Rules
			if (my.opts.middle || my.opts.second) {
				var patterns = [];
				var minLen = 2;
				var maxLen = ROBOT_LENGTH_LIMIT[level];
				if (maxLen > 50) maxLen = 50; // Increased cap to 50 for better long word support

				// Optimization for "Second Only" rule (No Loop needed)
				if (my.opts.second && !my.opts.middle) {
					if (isRev) {
						// KAP + Second: Link is at Index 1.
						// Pattern: Ends with 'adc', Char at 1 is 'preferredChar'.
						regex = `^.${preferredChar}.*(${adc})$`;
					} else {
						// Standard + Second: Link is at Index (Len-2).
						// Pattern: Starts with 'adc', Char at (Len-2) is 'preferredChar'.
						// This means the word ends with "PreferredChar + AnyChar".
						regex = `^(${adc}).*${preferredChar}.$`;
					}
				} else {
					// Middle Rule (requires loop)
					for (var len = minLen; len <= maxLen; len++) {
						var idx = -1;

						// Replicate getChar index logic
						if (my.opts.middle && my.opts.second) {
							if (len % 2 !== 0) idx = Math.floor(len / 2);
							else idx = isRev ? (len / 2) : (len / 2 - 1);
						} else if (my.opts.middle) {
							if (len % 2 !== 0) idx = Math.floor(len / 2);
							else idx = isRev ? (len / 2 - 1) : (len / 2);
						}
						// Note: Second-only is handled above, so no else needed here.

						if (idx >= 0 && idx < len) {
							var pre = idx;
							var post = len - 1 - idx;

							if (pre < 0) continue;
							patterns.push(`.{${pre}}${preferredChar}.{${post}}`);
						}
					}

					if (patterns.length > 0) {
						if (isRev) {
							// KAP: Matches Tail (adc)
							regex = `^(${patterns.join('|')})(${adc})$`;
							// Wait, patterns define the whole word structure (dots).
							// If pattern is `.{2}P.{3}`, it describes a 6-letter word.
							// We need to enforce `adc` at the end (KAP) or start (Standard).
							// Regex must satisfy BOTH: "Matches Pattern" AND "Starts/Ends with adc".
							// Using Lookahead is best.

							// KAP: Ends with adc.
							regex = `^(?=.*(${adc})$)(${patterns.join('|')})$`;
						} else {
							// Standard: Starts with adc.
							regex = `^(?=(${adc}))(${patterns.join('|')})$`;
						}
					} else {
						// Fallback if no patterns
						if (isRev) regex = `^${preferredChar}.*(${adc})$`;
						else regex = `^(${adc}).*${preferredChar}$`;
					}
				}
			} else {
				if (isRev) {
					// Ends with game char (adc), starts with preferred char
					regex = `^${preferredChar}.*(${adc})$`;
				} else {
					// Starts with game char (adc), ends with preferred char
					regex = `^(${adc}).*${preferredChar}$`;
				}
			}

			var query = [['_id', new RegExp(regex)]];
			var flagMask = 0;

			// Apply Rule Filters
			if (my.rule.lang == "ko") {
				// Injeong: If OFF, exclude INJEONG words
				if (!my.opts.injeong) flagMask |= Const.KOR_FLAG.INJEONG;

				// Loanword: If ON (Forbid), exclude LOANWORD words
				if (my.opts.loanword) flagMask |= Const.KOR_FLAG.LOANWORD;

				// Strict: If ON, exclude SPACED, SATURI, OLD, MUNHWA
				if (my.opts.strict) {
					flagMask |= (Const.KOR_FLAG.SPACED | Const.KOR_FLAG.SATURI | Const.KOR_FLAG.OLD | Const.KOR_FLAG.MUNHWA);
					query.push(['type', Const.KOR_STRICT]);
				} else {
					query.push(['type', Const.KOR_GROUP]);
				}

				if (flagMask > 0) {
					query.push(['flag', { '$nand': flagMask }]);
				}
			} else {
				// English rules
				query.push(['_id', Const.ENG_ID]);
			}

			DB.kkutu[my.rule.lang].find(
				...query
			).limit(20).on(function (list) {
				// Filter done words
				if (list && list.length) {
					list = list.filter(function (w) {
						return w._id.length <= ROBOT_LENGTH_LIMIT[level] && !robot._done.includes(w._id);
					});
				}

				if (list && list.length > 0) {
					console.log(`[BOT] Priority 1 Success: Found ${list.length} candidates`);
					// Shuffle the list to add randomness
					list = shuffle(list);
					pickList(list);
				} else {
					console.log(`[BOT] Priority 1 Failed: No candidates found for regex ${regex} with flags ${flagMask}, falling back`);
					decideStrategy();
				}
			});
		});
	} else {
		decideStrategy();
	}

	function decideStrategy() {
		var strategy = "NORMAL";
		var isKKT = (Const.GAME_TYPE[my.mode] == "KKT" || Const.GAME_TYPE[my.mode] == "EKK");
		var decided = false;

		// Mode Constraints
		var effPersonality = personality;
		if (isKKT && effPersonality < 0) effPersonality = 0; // KKT: No Long Word personality

		// Priority 2: Personality Check
		if (effPersonality !== 0 && level >= 2) {
			var roll = Math.random();
			var prob = PERSONALITY_CONST[level] * Math.abs(effPersonality);
			console.log(`[BOT] Priority 2 (Personality): Roll=${roll.toFixed(3)}, Prob=${prob.toFixed(3)}`);
			if (roll < prob) {
				if (effPersonality > 0) strategy = "ATTACK";
				else if (effPersonality < 0 && !isKKT) strategy = "LONG";
				decided = true;
			}
		}

		// Priority 3: Fallback (Special Move vs Normal)
		if (!decided && level >= 2) {
			var roll = Math.random();
			var prob = SPECIAL_MOVE_PROB[level];
			console.log(`[BOT] Priority 3 (Special Move): Roll=${roll.toFixed(3)}, Prob=${prob.toFixed(3)}`);
			if (roll < prob) {
				// Special Move Triggered
				if (isKKT) strategy = "ATTACK";
				else {
					// For non-KKT, pick randomly between ATTACK and LONG
					strategy = Math.random() < 0.5 ? "ATTACK" : "LONG";
				}
			} else {
				// Normal Strategy
				strategy = "NORMAL";
			}
		}

		console.log(`[BOT] Final Strategy: ${strategy}`);
		executeStrategy(strategy);
	}

	function executeStrategy(strategy) {
		var limitMultiplier = 1;
		if (strategy === "ATTACK" || strategy === "LONG") limitMultiplier = 4; // Fetch 4x for advanced selection (2x Freq + 2x Random)

		getAuto.call(my, my.game.char, my.game.subChar, 2, limitMultiplier).then(function (list) {
			console.log(`[BOT] executeStrategy: ${strategy}, fetched ${list ? list.length : 0} words`);
			if (list && list.length) {
				// Filter by length limit and done list
				list = list.filter(function (w) {
					return w._id.length <= ROBOT_LENGTH_LIMIT[level] && !robot._done.includes(w._id);
				});

				if (list.length === 0) {
					if (strategy !== "NORMAL") {
						console.log(`[BOT] Strategy ${strategy} failed (no candidates), falling back to NORMAL`);
						executeStrategy("NORMAL");
					} else {
						denied();
					}
					return;
				}

				if (strategy === "LONG") {
					// 2x Frequency + 2x Random logic
					// Sort by Hit DESC first to identify "Frequency" pool
					list.sort(function (a, b) { return b.hit - a.hit; });

					var limit = ROBOT_CANDIDATE_LIMIT[level];
					var freqPool = list.slice(0, limit * 2);
					var restPool = list.slice(limit * 2);
					var randomPool = shuffle(restPool).slice(0, limit * 2);

					var combined = freqPool.concat(randomPool);
					// Sort combined by Length DESC
					combined.sort(function (a, b) { return b._id.length - a._id.length; });

					var top = combined.slice(0, 10); // Pick from top 10
					pickList(top);

				} else if (strategy === "ATTACK") {
					// 2x Frequency + 2x Random logic
					list.sort(function (a, b) { return b.hit - a.hit; }); // Hit DESC (Frequency)

					var limit = ROBOT_CANDIDATE_LIMIT[level];
					var freqPool = list.slice(0, limit * 2);
					var restPool = list.slice(limit * 2);
					var randomPool = shuffle(restPool).slice(0, limit * 2);

					var combined = freqPool.concat(randomPool);
					// Deduplicate
					combined = combined.filter((item, index) => combined.indexOf(item) === index);

					// Analyze Next Word Counts for top candidates
					// Check top 15 candidates from the combined pool
					var checkList = combined.slice(0, 15);

					console.log(`[BOT] Analyzing ${checkList.length} candidates for Attack...`);

					var promises = checkList.map(function (w) {
						var endChar = getChar.call(my, w._id);
						return countNextWords(endChar).then(function (count) {
							w.nextCount = count;
							return w;
						});
					});

					Promise.all(promises).then(function (results) {
						// Sort PURELY by nextCount ASC (Fewest next words = Best Attack)
						results.sort(function (a, b) { return a.nextCount - b.nextCount; });

						if (results.length > 0) {
							console.log(`[BOT] Top Attack Candidate: ${results[0]._id} (Next: ${results[0].nextCount})`);
							// Pick the absolute best (or top few?)
							// For strict attack, picking top 1 is best.
							// But to populate candidates for retry, we should pass all 'results'.
							pickList(results);
						} else {
							if (strategy !== "NORMAL") {
								console.log(`[BOT] Attack analysis yielded no results, falling back to NORMAL`);
								executeStrategy("NORMAL");
							} else {
								denied();
							}
						}
					});

				} else {
					// NORMAL strategy
					list.sort(function (a, b) { return b.hit - a.hit; });
					var top = list.slice(0, ROBOT_CANDIDATE_LIMIT[level]);
					var rest = list.slice(ROBOT_CANDIDATE_LIMIT[level]);
					list = shuffle(top).concat(rest);
					pickList(list);
				}
			} else {
				denied();
			}
		});
	}

	function denied() {
		var char = my.game.char;
		var charMsgs = [
			`${char}${char}${char}`,
			`${char}..`,
			`${char}??`,
			`${char}... T.T`
		];

		if (isRev) {
			charMsgs = [
				`${char}${char}${char}`,
				`..${char}`,
				`??${char}`,
				`T.T ...${char}`
			];
		}

		var firstMsg = charMsgs[Math.floor(Math.random() * charMsgs.length)];
		var secondMsg = Const.ROBOT_DEFEAT_MESSAGES[Math.floor(Math.random() * Const.ROBOT_DEFEAT_MESSAGES.length)];

		text = firstMsg;
		after();

		delay += 200;

		text = secondMsg;
		after();
	}
	function pickList(list) {
		if (list && list.length > 0) {
			robot.data.candidates = list;
			robot.data.candidateIndex = 0;
			// Pick from the top of the list (since it's already sorted by Strategy)
			// For Attack: Sorted by NextCount ASC.
			// For Long: Sorted by Length DESC.
			// For Normal: Frequency/Random mix.

			var candidate = list[0];

			if (candidate) {
				w = candidate;
				text = w._id;
				delay += 500 * ROBOT_THINK_COEF[level] * Math.random() / Math.log(1.1 + w.hit);
				console.log(`[BOT] Picked word: ${text} (Hit: ${w.hit}, Len: ${text.length}, Source: ${robot.data.candidates.length} candidates)`);
				after();
			} else denied();
		} else denied();
	}
	function after() {
		delay += text.length * ROBOT_TYPE_COEF[level];
		robot._done.push(text);
		setTimeout(my.turnRobot, delay, robot, text);
	}
	function getWishList(list) {
		var R = new Lizard.Tail();
		var wz = [];
		var res;

		for (i in list) wz.push(getWish(list[i]));
		Lizard.all(wz).then(function ($res) {
			if (!my.game.chain) return;
			$res.sort(function (a, b) { return a.length - b.length; });

			if (my.opts.manner || !my.game.chain.length) {
				while (res = $res.shift()) if (res.length) break;
			} else res = $res.shift();
			R.go(res ? res.char : null);
		});
		return R;
	}
	function getWish(char) {
		var R = new Lizard.Tail();

		DB.kkutu[my.rule.lang].find(['_id', new RegExp(isRev ? `.${char}$` : `^${char}.`)]).limit(10).on(function ($res) {
			R.go({ char: char, length: $res.length });
		});
		return R;
	}
};
function getMission(l) {
	var arr = (l == "ko") ? Const.MISSION_ko : Const.MISSION_en;

	if (!arr) return "-";
	return arr[Math.floor(Math.random() * arr.length)];
}
function getAuto(char, subc, type, limit) {
	/* type
		0 무작위 단어 하나
		1 존재 여부
		2 단어 목록
	*/
	var my = this;
	var R = new Lizard.Tail();
	var gameType = Const.GAME_TYPE[my.mode];
	var adv, adc;
	var key = gameType + "_" + keyByOptions(my.opts);
	var MAN = DB.kkutu_manner[my.rule.lang];
	var bool = type == 1;

	adc = char + (subc ? ("|" + subc) : "");
	switch (gameType) {
		case 'EKK':
			adv = `^(${adc}).{${my.game.wordLength - 1}}$`;
			break;
		case 'EKT':
			adv = `^(${adc})..`;
			break;
		case 'KSH':
			adv = `^(${adc}).`;
			break;
		case 'ESH':
			adv = `^(${adc})...`;
			break;
		case 'KKT':
			adv = `^(${adc}).{${my.game.wordLength - 1}}$`;
			break;
		case 'KAP':
			adv = `.(${adc})$`;
			break;
	}
	if (!char) {
		console.log(`Undefined char detected! key=${key} type=${type} adc=${adc}`);
	}
	MAN.findOne(['_id', char || "★"]).on(function ($mn) {
		if ($mn && bool) {
			if ($mn[key] === null) produce();
			else R.go($mn[key]);
		} else {
			produce();
		}
	});
	function produce() {
		var aqs = [['_id', new RegExp(adv)]];
		var aft;
		var lst;

		if (!my.opts.injeong) aqs.push(['flag', { '$nand': Const.KOR_FLAG.INJEONG }]);
		if (my.rule.lang == "ko") {
			if (my.opts.loanword) aqs.push(['flag', { '$nand': Const.KOR_FLAG.LOANWORD }]);
			if (my.opts.strict) aqs.push(['type', Const.KOR_STRICT], ['flag', { $lte: 3 }]);
			else aqs.push(['type', Const.KOR_GROUP]);
		} else {
			aqs.push(['_id', Const.ENG_ID]);
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
		DB.kkutu[my.rule.lang].find.apply(this, aqs).limit((bool ? 1 : 123) * (limit || 1)).on(function ($md) {
			forManner($md);
			if (my.game.chain) aft($md.filter(function (item) { return !my.game.chain.includes(item); }));
			else aft($md);
		});
		function forManner(list) {
			if (my.opts.unknown) return;
			lst = list;
			MAN.upsert(['_id', char]).set([key, lst.length ? true : false]).on(null, null, onFail);
		}
		function onFail() {
			MAN.createColumn(key, "boolean").on(function () {
				forManner(lst);
			});
		}
	}
	return R;
}
function keyByOptions(opts) {
	var arr = [];

	if (opts.injeong) arr.push('X');
	if (opts.loanword) arr.push('L');
	if (opts.strict) arr.push('S');
	return arr.join('');
}
function shuffle(arr) {
	var i, r = [];

	for (i in arr) r.push(arr[i]);
	r.sort(function (a, b) { return Math.random() - 0.5; });

	return r;
}
function getChar(text) {
	var my = this;
	var type = Const.GAME_TYPE[my.mode];
	var len = text.length;
	var idx = -1;
	var isKAP = type === 'KAP';

	if (type === 'EKT' && my.rule.lang === 'en' && (my.opts.middle || my.opts.second)) {
		my._lastWordLen = len;
		if (len === 2) {
			if (my.opts.second) return text.charAt(0);
			return text.slice(-1);
		}

		if (my.opts.middle) {
			if (len % 2 !== 0) {
				idx = Math.floor(len / 2);
				return text.slice(idx - 1, idx + 2);
			} else {
				idx = len / 2;
				return text.slice(idx - 1, idx + 2);
			}
		}

		if (my.opts.second) {
			if (len >= 4) return text.slice(len - 4, len - 1);
			else if (len === 3) return text;
		}
	}

	if (my.opts.middle || my.opts.second) {
		if (my.opts.middle && my.opts.second) {
			if (len % 2 !== 0) idx = Math.floor(len / 2);
			else idx = isKAP ? (len / 2) : (len / 2 - 1);
		} else if (my.opts.middle) {
			if (len % 2 !== 0) idx = Math.floor(len / 2);
			else idx = isKAP ? (len / 2 - 1) : (len / 2);
		} else {
			idx = isKAP ? 1 : (len - 2);
		}

		if (idx >= 0 && idx < len) return text.charAt(idx);
	}

	switch (type) {
		case 'EKT': return text.slice(text.length - 3);
		case 'EKK':
		case 'ESH':
		case 'KKT':
		case 'KSH': return text.slice(-1);
		case 'KAP': return text.charAt(0);
	}
};
function getSubChar(char) {
	var my = this;
	var r;
	var c = char.charCodeAt();
	var k;
	var ca, cb, cc;

	switch (Const.GAME_TYPE[my.mode]) {
		case "EKT":
			if (my.rule.lang === 'en' && (my.opts.middle || my.opts.second)) {
				var len = my._lastWordLen;
				if (len && len !== 2) {
					if (my.opts.middle) {
						if (len % 2 !== 0) r = char.slice(1);
						else r = char.slice(0, 2);
					} else if (my.opts.second) {
						if (len >= 4) r = char.slice(1);
						else if (len === 3) r = char.slice(0, 2);
					}
				}
				if (r) break;
			}
			if (char.length > 2) r = char.slice(1);
			break;
		case "EKK":
		case "KKT": case "KSH": case "KAP":
			k = c - 0xAC00;
			if (k < 0 || k > 11171) break;
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
			break;
		case "ESH": default:
			break;
	}
	return r;
}
function getReverseDueumChars(char) {
	var c = char.charCodeAt() - 0xAC00;
	if (c < 0 || c > 11171) return [];
	var medial = Math.floor(c / 28) % 21;
	var initial = Math.floor(c / 28 / 21);
	var final = c % 28;

	// Initial Codes: ㄴ(2, 4354), ㄹ(5, 4357), ㅇ(11, 4363)
	var curInitialCode = initial + 0x1100;
	var medialCode = medial + 0x1161;
	var results = [];

	// From ㄴ?
	if (curInitialCode === 4354) { // Current is ㄴ
		if (RIEUL_TO_NIEUN.includes(medialCode)) {
			results.push(String.fromCharCode(0xAC00 + (5 * 21 + medial) * 28 + final));
		}
	}
	// From ㅇ?
	else if (curInitialCode === 4363) { // Current is ㅇ
		if (RIEUL_TO_IEUNG.includes(medialCode)) {
			results.push(String.fromCharCode(0xAC00 + (5 * 21 + medial) * 28 + final));
		}
		if (NIEUN_TO_IEUNG.includes(medialCode)) {
			results.push(String.fromCharCode(0xAC00 + (2 * 21 + medial) * 28 + final));
		}
	}

	return results;
}