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
var TYL = require('./typing_const');
var Lizard = require('../../sub/lizard');
var DB;
var DIC;

var LIST_LENGTH = 200;
var DOUBLE_VOWELS = [9, 10, 11, 14, 15, 16, 19];
var DOUBLE_TAILS = [3, 5, 6, 9, 10, 11, 12, 13, 14, 15, 18];
const BOT_CPM = [30, 70, 150, 250, 500];
const BOT_ACCURACY = [0.9, 0.95, 0.98, 0.99, 1.0];

function traverse(func) {
	var my = this;
	var i, o;

	for (i in my.game.seq) {
		var item = my.game.seq[i];
		if (typeof item === 'string') {
			if (!(o = DIC[item])) continue;
		} else {
			o = item;
		}
		if (!o.game) continue;
		func(o);
	}
}
exports.init = function (_DB, _DIC) {
	DB = _DB;
	DIC = _DIC;
};
exports.getTitle = function () {
	var R = new Lizard.Tail();
	var my = this;
	var i, j;

	if (my.opts.proverb) pick(TYL.PROVERBS[my.rule.lang]);
	else {
		var minLen = 2, maxLen = 5;
		if (my.opts.long) {
			minLen = 9;
			maxLen = 14;
		}
		DB.kkutu[my.rule.lang].direct(`SELECT _id FROM kkutu_${my.rule.lang} WHERE LENGTH(_id) BETWEEN ${minLen} AND ${maxLen} AND hit >= 1 ORDER BY RANDOM() LIMIT 416`, function (err, res) {
			if (err || !res || !res.rows) return;
			pick(res.rows.map(function (item) { return item._id; }));
		});
	}
	function pick(list) {
		var data = [];
		var len = list.length;
		var arr;

		for (i = 0; i < my.round; i++) {
			arr = [];
			for (j = 0; j < LIST_LENGTH; j++) {
				arr.push(list[Math.floor(Math.random() * len)]);
			}
			data.push(arr);
		}
		my.game.lists = data;
		R.go("①②③④⑤⑥⑦⑧⑨⑩");
	}
	traverse.call(my, function (o) {
		o.game.spl = 0;
	});
	return R;
};
exports.roundReady = function () {
	var my = this;
	var scores = {};

	if (!my.game.lists) return;

	my.game.round++;
	my.game.roundTime = my.time * 1000;
	if (my.game.round <= my.round) {
		my.game.clist = my.game.lists.shift();
		my.byMaster('roundReady', {
			round: my.game.round,
			list: my.game.clist,
			long: my.opts.long
		}, true);
		setTimeout(my.turnStart, 2400);
	} else {
		traverse.call(my, function (o) {
			scores[o.id] = Math.round(o.game.spl / my.round);
		});
		my.roundEnd({ scores: scores });
	}
};
exports.turnStart = function () {
	var my = this;

	my.game.late = false;
	traverse.call(my, function (o) {
		o.game.miss = 0;
		o.game.index = 0;
		o.game.semi = 0;
		o.game.out = false;
		if (o.robot) exports.playRobot.call(my, o);
	});
	my.game.qTimer = setTimeout(my.turnEnd, my.game.roundTime);
	my.byMaster('turnStart', { roundTime: my.game.roundTime }, true);
};
exports.turnEnd = function () {
	var my = this;
	var spl = {};
	var sv;

	my.game.late = true;
	clearTimeout(my.game.qTimer); // In case it was called manually
	traverse.call(my, function (o) {
		if (o.robot) clearTimeout(o.game.typingTimer);
		sv = (o.game.semi + o.game.index - o.game.miss) / my.time * 60;
		spl[o.id] = Math.round(sv);
		o.game.spl += sv;
	});
	my.byMaster('turnEnd', {
		ok: false,
		speed: spl
	});
	my.game._rrt = setTimeout(my.roundReady, (my.game.round == my.round) ? 3000 : 10000);
};
exports.submit = function (client, text) {
	var my = this;
	var score;
	var allOut = true;

	if (!client.game) return;
	if (client.game.out) return;
	if (!my.game.clist) return;

	if (my.opts.mirror) text = text.split("").reverse().join("");
	if (my.game.clist[client.game.index] == text) {
		score = my.getScore(text);

		client.game.semi += score;
		client.game.score += score;
		client.publish('turnEnd', {
			target: client.id,
			ok: true,
			value: text,
			score: score
		}, true);
		client.invokeWordPiece(text, 0.5);
	} else {
		client.game.miss++;
		if (my.opts.one && client.game.miss >= 1) {
			client.game.out = true;
			// Use client.send to notify only the dying player, avoiding round termination for others
			client.publish('turnEnd', {
				target: client.id,
				ok: false,
				score: 0
			}, true);

			traverse.call(my, function (o) {
				if (!o.game.out) allOut = false;
			});
			console.log(`[DEBUG] OneChance: Player ${client.id} OUT. AllOut=${allOut}`);
			if (allOut) my.turnEnd();
			return;
		}
		client.send('turnEnd', { error: true });
	}
	if (!my.game.clist[++client.game.index]) client.game.index = 0;
};
exports.getScore = function (text) {
	var my = this;
	var i, len = text.length;
	var r = 0, s, t;

	switch (my.rule.lang) {
		case 'ko':
			for (i = 0; i < len; i++) {
				s = text.charCodeAt(i);
				if (s < 44032) {
					r++;
				} else {
					t = (s - 44032) % 28;
					r += t ? 3 : 2;
					if (DOUBLE_VOWELS.includes(Math.floor(((text.charCodeAt(i) - 44032) % 588) / 28))) r++;
					if (DOUBLE_TAILS.includes(t)) r++;
				}
			}
			return r;
		case 'en': return len;
		default: return r;
	}
};
exports.playRobot = function (robot) {
	var my = this;
	var targetWord;
	var level, cpm, accuracy;
	var charCount, timeNeeded;

	if (my.game.late) return;
	if (robot.game.out) return;

	targetWord = my.game.clist[robot.game.index];
	if (!targetWord) return;

	level = robot.level;
	cpm = BOT_CPM[level];
	accuracy = BOT_ACCURACY[level];

	charCount = targetWord.length;
	timeNeeded = (charCount * 60 * 1000) / cpm;

	if (my.opts.mirror) {
		timeNeeded *= 1.25;
		targetWord = targetWord.split("").reverse().join("");
	}

	timeNeeded += (Math.random() * 100 - 50);

	robot.game.typingTimer = setTimeout(function () {
		if (my.game.late) return;
		if (!my.game.clist) return;
		if (robot.game.out) return;

		var isCorrect = Math.random() < accuracy;
		var input = isCorrect ? targetWord : "@";

		my.submit(robot, input);

		// Continue to next word
		exports.playRobot.call(my, robot);
	}, timeNeeded);
};