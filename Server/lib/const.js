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

var GLOBAL = require("./sub/global.json");

exports.KKUTU_MAX = 400;
exports.MAIN_PORTS = GLOBAL.MAIN_PORTS;
exports.TEST_PORT = 4040;
exports.SPAM_CLEAR_DELAY = 1600;
exports.SPAM_ADD_DELAY = 750;
exports.SPAM_LIMIT = 7;
exports.BLOCKED_LENGTH = 10000;
exports.KICK_BY_SPAM = 9;
exports.MAX_OBSERVER = 4;
exports.TESTER = GLOBAL.ADMIN.concat([
	"Input tester id here"
]);
exports.IS_SECURED = GLOBAL.IS_SECURED;
exports.SSL_OPTIONS = GLOBAL.SSL_OPTIONS;
exports.OPTIONS = {
	'man': { name: "Manner" },
	'ext': { name: "Injeong" },
	'mis': { name: "Mission" },
	'loa': { name: "Loanword" },
	'prv': { name: "Proverb" },
	'str': { name: "Strict" },
	'k32': { name: "Sami" },
	'no2': { name: "No2" },
	'unk': { name: "Unknown" },
	'big': { name: "Big" },
	'trp': { name: "Triple" },
	'one': { name: "One" },
	'mir': { name: "Mirror" },
	'ret': { name: "Return" },
	'mid': { name: "Middle" },
	'sch': { name: "Second" },
	'vow': { name: "Vowel" },
	'lng': { name: "Long" },
	'unl': { name: "Unlimited" },
	'sur': { name: "Survival" },
	'fdu': { name: "FreeDueum" }

};
exports.ROBOT_TIMEOUT_MESSAGES = [ // 다른 플레이어가 게임오버되면 봇이 보내는 메시지
	"저런", "ㅋㅋㅋㅋ", "안타깝네요", "아이고...", "바부", "컷~",
	"잘가시고~", "ㅋㅋㅋㅋㅋㅋ", "멍충이", "아이고야", "그럴 수도 있지"
];
exports.ROBOT_DEFEAT_MESSAGES_2 = [ // 남은 단어가 없으면 봇이 보내는 메시지
	"뭐였더라?", "단어가 생각이 안나", "아 까먹었다", "GG", "모르겠어",
	"기억이 안 나...", "아 뭐지?", "생각이 안 나네", "단어 더 없나?",
	"에라이", "으앙", "ㅇㅅㅇ"
];
exports.ROBOT_VICTORY_MESSAGES = [ // 봇이 한방단어를 주고 보내는 메시지
	"ㄴㅇㅅ", "ㅅㄱ", "ㅂㅂ", "잘가시게", "이거나 먹어라", ":3", ":)", "^-^", "OwO",
	"ㅋㅋㅋㅋ", "나이스~", "한번 당해봐라!", "바이바이~", "ㅋㅋㅋㅋㅋㅋ", "ㅎㅎ",
	"즐~", "ㅃㅃ", "ㅋㅋㅋㅋㅋㅋㅋㅋ", "수고~", "안녕은 영원한 헤어짐은 아니겠지요~",
	"이얍!", "이건 못 참지"
];
exports.ROBOT_DEFEAT_MESSAGES = [ // 봇이 한방단어를 받았을 때 보내는 메시지
	"아니", "살살 좀 해", "짜증나", "이건 너무하잖아...", "으앙", "히잉", "아놔...",
	"ㅁㄴㅇㄹ", "ㅁㄴㅇㄹㄹㅇㄴㄹㅇㄴㅁㄹㄴㅇㄹㅇㄴㄹㅇㄴㅁㄴㅇㄹ", "님아 제발",
	"ㅠㅠ", "너무해", "선넘네", "이렇게 가는구나...", "이런!", "에라이",
	"그래 너 끄투 잘한다", "꽤나 잘하는 분이시군", "다음에는 내가 한방단어 줄테니 기대해",
	"아니 님아", "아 제발", "뿌에엥", "꿼!", "악", "안돼", "ㅠㅠ", "?ㅠ", "아슬프다",
	"너 봇이지?", "치트 쓰지마", "사기치지마", "으아악", "어...?", "???"
];
exports.MOREMI_PART = ["back", "shoes", "clothes", "head", "eye", "mouth", "lhand", "rhand"];
exports.CATEGORIES = ["all", "spec", "skin", "badge", "head", "eye", "mouth", "clothes", "hs", "back"];
exports.AVAIL_EQUIP = [
	"NIK", "BDG1", "BDG2", "BDG3", "BDG4",
	"blackbere", "black_mask", "blue_headphone", "brownbere", "haksamo", "hamster_G", "hamster_O", "miljip", "nekomimi", "orange_headphone", "redbere", "twoeight", "white_mask",
	"bigeye", "brave_eyes", "close_eye", "cuspidal", "double_brows", "inverteye", "lazy_eye", "scouter", "sunglasses",
	"beardoll", "cat_mouth", "decayed_mouth", "laugh", "merong", "mustache", "oh",
	"blackrobe", "blue_vest", "medal", "orange_vest", "pants_china", "pants_japan", "pants_korea", "pink_vest", "sqpants", "water",
	"bluecandy", "bokjori", "choco_ice", "lemoncandy", "melon_ice", "pinkcandy", "purple_ice",
	"black_oxford", "black_shoes", "brown_oxford", "loosesocks", "ilusweater", "kktpixel", "pixgradg", "pixgrado",
	"Mhead", "Meye", "Mmouth", "Mclothes", "Mshoes", "Mhand"
];

exports.GROUPS = {
	'spec': ["PIX", "PIY", "PIZ", "CNS"],
	'skin': ["NIK"],
	'badge': ["BDG1", "BDG2", "BDG3", "BDG4"],
	'head': ["blackbere", "black_mask", "blue_headphone", "brownbere", "haksamo", "hamster_G", "hamster_O", "miljip", "nekomimi", "orange_headphone", "redbere", "twoeight", "white_mask", "Mhead"],
	'eye': ["bigeye", "brave_eyes", "close_eye", "cuspidal", "double_brows", "inverteye", "lazy_eye", "scouter", "sunglasses", "Meye"],
	'mouth': ["beardoll", "cat_mouth", "decayed_mouth", "laugh", "merong", "mustache", "oh", "Mmouth"],
	'clothes': ["blackrobe", "blue_vest", "medal", "orange_vest", "pants_china", "pants_japan", "pants_korea", "pink_vest", "sqpants", "water", "ilusweater", "kktpixel", "pixgradg", "pixgrado", "Mclothes"],
	'hs': ["bluecandy", "bokjori", "choco_ice", "lemoncandy", "melon_ice", "pinkcandy", "purple_ice", "black_oxford", "black_shoes", "brown_oxford", "loosesocks", "Mshoes", "Mhand"],
	'back': ["Mback", "Mfront"]
};
exports.RULE = {
	/*
		유형: { lang: 언어,
			rule: 이름,
			opts: [ 추가 규칙 ],
			time: 시간 상수,
			ai: AI 가능?,
			big: 큰 화면?,
			ewq: 현재 턴 나가면 라운드 종료?
		}
	*/

	'EKT': {
		lang: "en",
		rule: "Classic",
		opts: ["man", "ext", "mis", "unk", "one", "ret", "mid", "sch"],
		time: 1,
		ai: true,
		big: false,
		ewq: true
	},
	'EKK': {
		lang: "en",
		rule: "Classic",
		opts: ["ext", "mis", "unk", "one", "ret", "mid", "sch"],
		time: 1,
		ai: true,
		big: false,
		ewq: true
	},
	'ESH': {
		lang: "en",
		rule: "Classic",
		opts: ["ext", "mis", "unk", "one", "ret", "mid", "sch"],
		time: 1,
		ai: true,
		big: false,
		ewq: true
	},
	'KKT': {
		lang: "ko",
		rule: "Classic",
		opts: ["man", "ext", "mis", "loa", "str", "k32", "unk", "one", "ret", "mid", "sch", "fdu"],
		time: 1,
		ai: true,
		big: false,
		ewq: true
	},

	'KSH': {
		lang: "ko",
		rule: "Classic",
		opts: ["man", "ext", "mis", "loa", "str", "unk", "one", "ret", "mid", "sch", "fdu"],
		time: 1,
		ai: true,
		big: false,
		ewq: true
	},
	'CSQ': {
		lang: "ko",
		rule: "Jaqwi",
		opts: ["ijp", "vow", "unl"],
		time: 1,
		ai: true,
		big: false,
		ewq: false
	},

	'KCW': {
		lang: "ko",
		rule: "Crossword",
		opts: [],
		time: 2,
		ai: false,
		big: true,
		ewq: false
	},
	'KTY': {
		lang: "ko",
		rule: "Typing",
		opts: ["prv", "mir", "one", "lng"],
		time: 1,
		ai: true,
		big: false,
		ewq: false
	},
	'ETY': {
		lang: "en",
		rule: "Typing",
		opts: ["prv", "mir", "one", "lng"],
		time: 1,
		ai: true,
		big: false,
		ewq: false
	},
	'KAP': {
		lang: "ko",
		rule: "Classic",
		opts: ["man", "ext", "mis", "loa", "str", "unk", "one", "ret", "mid", "sch", "fdu"],
		time: 1,
		ai: true,
		big: false,
		_back: true,
		ewq: true
	},
	'HUN': {
		lang: "ko",
		rule: "Hunmin",
		opts: ["ext", "mis", "loa", "str", "one", "ret"],
		time: 1,
		ai: true,
		big: false,
		ewq: true
	},
	'KDA': {
		lang: "ko",
		rule: "Daneo",
		opts: ["ijp", "mis", "trp", "one", "ret"],
		time: 1,
		ai: true,
		ewq: false
	},
	'EDA': {
		lang: "en",
		rule: "Daneo",
		opts: ["ijp", "mis", "trp", "one", "ret"],
		time: 1,
		ai: true,
		big: false,
		ewq: true
	},
	'KSS': {
		lang: "ko",
		rule: "Sock",
		opts: ["no2", "big"],
		time: 1,
		ai: false,
		big: true,
		ewq: false
	},
	'ESS': {
		lang: "en",
		rule: "Sock",
		opts: ["no2", "big"],
		time: 1,
		ai: false,
		big: true,
		ewq: false
	},
	'KFR': {
		lang: "ko",
		rule: "Free",
		opts: ["ext", "mis", "one", "unk", "ret"],
		time: 1,
		ai: true,
		big: false,
		ewq: true
	},
	'KSC': {
		lang: "ko",
		rule: "Jaqwi",
		opts: ["ijp", "unl"],
		time: 1,
		ai: true,
		big: false,
		ewq: false
	},

};
exports.getPreScore = function (text, chain, tr) {
	return 2 * (Math.pow(5 + 7 * (text || "").length, 0.74) + 0.88 * (chain || []).length) * (0.5 + 0.5 * tr);
};
exports.getPenalty = function (chain, score) {
	return -1 * Math.round(Math.min(10 + (chain || []).length * 2.1 + score * 0.15, score));
};
exports.GAME_TYPE = Object.keys(exports.RULE);
exports.EXAMPLE_TITLE = {
	'ko': "일이삼사오육칠팔구십",
	'en': "twofivesix"
};
exports.INIT_SOUNDS = ["ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];
exports.VOWEL_SOUNDS = ["ㅏ", "ㅐ", "ㅑ", "ㅒ", "ㅓ", "ㅔ", "ㅕ", "ㅖ", "ㅗ", "ㅘ", "ㅙ", "ㅚ", "ㅛ", "ㅜ", "ㅝ", "ㅞ", "ㅟ", "ㅠ", "ㅡ", "ㅢ", "ㅣ"];
exports.MISSION_ko = ["가", "나", "다", "라", "마", "바", "사", "아", "자", "차", "카", "타", "파", "하"];
exports.MISSION_en = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"];

exports.KO_INJEONG = [
	"IMS", "VOC", "KRR", "KTV",
	"NSK", "KOT", "DOT", "DRR", "DGM", "RAG", "LVL",
	"LOL", "MRN", "MMM", "MAP", "MKK", "MNG",
	"MOB", "HYK", "CYP", "HRH", "STA", "OIJ",
	"KGR", "ESB", "ELW", "OIM", "OVW", "NEX", /*"WOW",*/
	"YRY", "KPO", "JLN", "JAN", "ZEL", "POK", "HAI",
	"HSS", "KMV", "HDC", "HOS", "FRC", "TPW"
];
exports.EN_INJEONG = [
	"LOL"
];
exports.KO_THEME = [
	"30", "40", "60", "80", "90",
	"140", "150", "160", "170", "190",
	"220", "230", "240", "270", "310",
	"320", "350", "360", "420", "430",
	"440", "450", "490", "530", "1001"
];
exports.EN_THEME = [
	"e05", "e08", "e12", "e13", "e15",
	"e18", "e20", "e43"
];
exports.IJP_EXCEPT = [
	"OIJ", "TPW"
];
exports.KO_IJP = exports.KO_INJEONG.concat(exports.KO_THEME).filter(function (item) { return !exports.IJP_EXCEPT.includes(item); });
exports.EN_IJP = exports.EN_INJEONG.concat(exports.EN_THEME).filter(function (item) { return !exports.IJP_EXCEPT.includes(item); });
exports.REGION = {
	'en': "en",
	'ko': "kr"
};
exports.KOR_STRICT = /(^|,)(1|INJEONG)($|,)/;
exports.KOR_GROUP = new RegExp("(,|^)(" + [
	"0", "1", "3", "7", "8", "11", "9",
	"16", "15", "17", "2", "18", "20", "26", "19",
	"INJEONG"
].join('|') + ")(,|$)");
exports.ENG_ID = /^[a-z]+$/i;
exports.KOR_FLAG = {
	LOANWORD: 1, // 외래어
	INJEONG: 2,	// 어인정
	SPACED: 4, // 띄어쓰기를 해야 하는 어휘
	SATURI: 8, // 방언
	OLD: 16, // 옛말
	MUNHWA: 32 // 문화어
};
exports.WP_REWARD = function () {
	return 10 + Math.floor(Math.random() * 91);
};
exports.getRule = function (mode) {
	return exports.RULE[exports.GAME_TYPE[mode]];
};

exports.BOT_NAME_TEMPLATES = [
	"나는 {0}다", "{0} 끄돌이", "{0} 끄순이",
	"끄투잘하고싶어요", "완전 물렙", "모레미귀여워", "모레미는 세계최강",
	"유기농 감자", "평범한 끄투러", "끄투가좋아", "한판해요"
];

exports.BOT_LEVEL_NAMES = {
	"-1": "바보",
	"0": "왕초보",
	"1": "초보",
	"2": "중수",
	"3": "고수",
	"4": "초고수"
};

exports.BOT_ITEM_WEIGHTS = {
	// "item_id": weight (default: 10)
	"nekomimi": 20,
	"cuspidal": 3,
	"black_mask": 3,
	"white_mask": 3

};
