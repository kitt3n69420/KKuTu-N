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

var MODE;
var BEAT = [null,
	"10000000",
	"10001000",
	"10101000",
	"10111000",
	"11111000",
	"11111010",
	"11111011",
	"11111111"
];
var NULL_USER = {
	profile: { title: L['null'] },
	data: { score: 0 }
};
var MOREMI_PART;
var AVAIL_EQUIP;
var RULE;
var OPTIONS;
var MAX_LEVEL = 360;
var TICK = 30;
var EXP = [];
var BAD = new RegExp(["\ub290\uc73c*[^\uac00-\ud7a3]*\uae08\ub9c8?", "\ub2c8[^\uac00-\ud7a3]*(\uc5c4|\uc570|\uc5e0)", "(\u3144|\u3145\u3142|\u3142\u3145)", "\ubbf8\uce5c(\ub144|\ub188)?", "(\ubcd1|\ube05|\ube59)[^\uac00-\ud7a3]*\uc2e0", "\ubcf4[^\uac00-\ud7a3]*\uc9c0", "(\uc0c8|\uc100|\uc314|\uc34c)[^\uac00-\ud7a3]*(\uae30|\ub07c)", "\uc139[^\uac00-\ud7a3]*\uc2a4", "(\uc2dc|\uc528|\uc26c|\uc4b8)\uc774*\uc785?[^\uac00-\ud7a3]*(\ubc1c|\ube68|\ubc8c|\ubed8|\ud314|\ud384)", "\uc2ed[^\uac00-\ud7a3]*\uc0c8", "\uc539", "(\uc560|\uc5d0)[^\uac00-\ud7a3]*\ubbf8", "\uc790[^\uac00-\ud7a3]*\uc9c0", "\uc874[^\uac00-\ud7a3]*\ub098", "\uc886|\uc8f6", "\uc9c0\ub784", "\ucc3d[^\uac00-\ud7a3]*(\ub140|\ub144|\ub188)", "fuck", "sex"].join('|'), "g");

var ws, rws;
var $stage;
var $sound = {};
var $_sound = {}; // 현재 재생 중인 것들
var $data = {};
var $lib = { Classic: {}, Jaqwi: {}, Crossword: {}, Typing: {}, Hunmin: {}, Daneo: {}, Sock: {} };
var $rec;
var mobile;

var audioContext = window.hasOwnProperty("AudioContext") ? (new AudioContext()) : false;
var _WebSocket = window['WebSocket'];
var _setInterval = setInterval;
var _setTimeout = setTimeout;