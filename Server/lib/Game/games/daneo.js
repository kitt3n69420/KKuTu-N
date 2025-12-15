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
const ROBOT_HIT_LIMIT = [4, 2, 1, 0, 0];
const ROBOT_LENGTH_LIMIT = [3, 6, 12, 24, 999];
const ROBOT_CANDIDATE_LIMIT = [10, 20, 40, 80, 40];
const SPECIAL_MOVE_PROB = [0, 0, 0.1, 0.25, 0.4];
const PERSONALITY_CONST = [0, 0, 0.5, 0.8, 0.99];
const PREFERRED_CHAR_PROB = [0.6, 0.7, 0.8, 0.9, 1.0];

exports.init = function (_DB, _DIC) {
	DB = _DB;
	DIC = _DIC;
};
exports.getTitle = function () {
	var R = new Lizard.Tail();
	var my = this;

	setTimeout(function () {
		R.go("①②③④⑤⑥⑦⑧⑨⑩");
	}, 500);
	return R;
};
exports.roundReady = function () {
	var my = this;
	var ijl = my.opts.injpick.length;

	clearTimeout(my.game.turnTimer);
	my.game.round++;
	my.game.roundTime = my.time * 1000;
	if (my.game.round <= my.round) {
		if (my.opts.triple) {
			my.game.theme = [];
			while (my.game.theme.length < 3 && my.game.theme.length < ijl) {
				var t = my.opts.injpick[Math.floor(Math.random() * ijl)];
				if (my.game.theme.indexOf(t) == -1) my.game.theme.push(t);
			}
		} else {
			my.game.theme = my.opts.injpick[Math.floor(Math.random() * ijl)];
		}
		my.game.chain = [];
		if (my.opts.mission) my.game.mission = getMission(my.rule.lang);
		my.byMaster('roundReady', {
			round: my.game.round,
			theme: my.game.theme,
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
	var target = DIC[my.game.seq[my.game.turn]] || my.game.seq[my.game.turn];
	var score;

	if (my.game.loading) {
		my.game.turnTimer = setTimeout(my.turnEnd, 100);
		return;
	}
	clearTimeout(my.game.turnTimer);
	if (!my.game.chain) return;

	my.game.late = true;
	if (target) if (target.game) {
		score = Const.getPenalty(my.game.chain, target.game.score);
		target.game.score += score;
	}
	getAuto.call(my, my.game.theme, 0).then(function (w) {
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
exports.submit = function (client, text, data) {
	var score, l, t;
	var my = this;
	var tv = (new Date()).getTime();
	var mgt = my.game.seq[my.game.turn];

	if (!mgt) return;
	if (!mgt.robot) if (mgt != client.id) return;
	if (!my.game.theme) return;
	if (my.game.chain.indexOf(text) == -1 || my.opts.return) {
		l = my.rule.lang;
		my.game.loading = true;
		function onDB($doc) {
			function preApproved() {
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
			function denied(code) {
				my.game.loading = false;
				client.publish('turnError', { code: code || 404, value: text }, true);
				if (my.opts.one) my.turnEnd();
			}
			if ($doc) {
				if ($doc.theme.match(toRegex(my.game.theme)) == null) denied(407);
				else preApproved();
			} else {
				denied();
			}
		}
		DB.kkutu[l].findOne(['_id', text]).limit(['mean', true], ['theme', true], ['type', true], ['hit', true]).on(onDB);
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
	}
};
exports.getScore = function (text, delay, ignoreMission) {
	var my = this;
	var tr = 1 - delay / my.game.turnTime;
	var score = Const.getPreScore(text, my.game.chain, tr);
	var arr;

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
	var w, text;
	var personality = robot.data.personality || 0;
	var preferredChar = robot.data.preferredChar;

	// 1. Preferred Character Logic
	// Removed for Word Battle mode per user request.

	decideStrategy();

	function decideStrategy() {
		var strategy = "NORMAL";
		// Daneo is effectively a "Word Battle" type (no attack in the sense of difficult next char, but long words are good)
		// User said: "Word Battle and Free... Special Move is always Long Word... Personality > 0 is treated as 0"

		var effPersonality = personality;
		if (effPersonality > 0) effPersonality = 0; // Treat attack personality as 0

		// Personality Check
		if (effPersonality !== 0 && level >= 2) {
			if (Math.random() < PERSONALITY_CONST[level] * Math.abs(effPersonality)) {
				if (effPersonality < 0) strategy = "LONG";
			}
		}

		// Neutral Check
		if (strategy === "NORMAL" && level >= 2) {
			if (Math.random() < SPECIAL_MOVE_PROB[level]) {
				strategy = "LONG";
			}
		}

		executeStrategy(strategy);
	}

	function executeStrategy(strategy) {
		var limit = 0;
		if (strategy === "LONG") limit = 3;

		var sort = (strategy === "LONG") ? { 'length(_id)': -1 } : null;

		getAuto.call(my, my.game.theme, 2, limit, sort).then(function (list) {
			if (list && list.length) {
				list = list.filter(function (w) {
					return w._id.length <= ROBOT_LENGTH_LIMIT[level] && !robot._done.includes(w._id);
				});

				if (list.length === 0) {
					if (strategy !== "NORMAL") {
						executeStrategy("NORMAL");
					} else {
						denied();
					}
					return;
				}

				if (strategy === "LONG") {
					// list is already sorted by length desc from DB
					var top = list.slice(0, 30);
					pickList(shuffle(top)); // Pick randomly from top 30
				} else {
					// NORMAL (Attack is disabled in Daneo per user request for "Word Battle" types)
					list.sort(function (a, b) { return b.hit - a.hit; });
					var top = list.slice(0, ROBOT_CANDIDATE_LIMIT[level]);
					var rest = list.slice(ROBOT_CANDIDATE_LIMIT[level]);
					list = shuffle(top).concat(rest);
					pickList(list);
				}
			} else {
				if (strategy !== "NORMAL") {
					executeStrategy("NORMAL");
				} else {
					denied();
				}
			}
		});
	}

	function denied() {
		text = Const.ROBOT_DEFEAT_MESSAGES_2[Math.floor(Math.random() * Const.ROBOT_DEFEAT_MESSAGES_2.length)];
		after();
	}
	function pickList(list) {
		if (list && list.length > 0) {
			robot.data.candidates = list;
			robot.data.candidateIndex = 0;
			var candidate = list[0];
			if (candidate) {
				w = candidate;
				text = w._id;
				delay += 500 * ROBOT_THINK_COEF[level] * Math.random() / Math.log(1.1 + w.hit);
				after();
			} else denied();
		} else denied();
	}
	function after() {
		delay += text.length * ROBOT_TYPE_COEF[level];
		setTimeout(my.turnRobot, delay, robot, text);
	}
};
function toRegex(theme) {
	if (typeof theme == "object") return new RegExp(`(^|,)(${theme.join('|')})($|,)`);
	return new RegExp(`(^|,)${theme}($|,)`);
}
function getMission(l) {
	var arr = (l == "ko") ? Const.MISSION_ko : Const.MISSION_en;

	if (!arr) return "-";
	return arr[Math.floor(Math.random() * arr.length)];
}
function getAuto(theme, type, limit, sort) {
	/* type
		0 무작위 단어 하나
		1 존재 여부
		2 단어 목록
	*/
	var my = this;
	var R = new Lizard.Tail();
	var bool = type == 1;

	var aqs = [['theme', toRegex(theme)]];
	var aft;
	var raiser;
	var lst = false;

	if (my.game.chain) aqs.push(['_id', { '$nin': my.game.chain }]);
	raiser = DB.kkutu[my.rule.lang].find.apply(this, aqs);
	if (sort) raiser.sort(sort);
	raiser.limit((bool ? 1 : 123) * (limit || 1));
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
	raiser.on(aft);

	return R;
}
function shuffle(arr) {
	var i, r = [];

	for (i in arr) r.push(arr[i]);
	r.sort(function (a, b) { return Math.random() - 0.5; });

	return r;
}