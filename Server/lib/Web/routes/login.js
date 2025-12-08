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

const MainDB = require("../db");
const JLog = require("../../sub/jjlog");
// const Ajae	 = require("../../sub/ajaejs").checkAjae;
const passport = require('passport');
const glob = require('glob-promise');
const GLOBAL = require("../../sub/global.json");
const config = require('../../sub/auth.json');
const path = require('path')

function process(req, accessToken, MainDB, $p, done) {
	$p.token = accessToken;
	$p.sid = req.session.id;

	let now = Date.now();
	$p.sid = req.session.id;
	req.session.admin = GLOBAL.ADMIN.includes($p.id);
	req.session.authType = $p.authType;
	JLog.info("Login Process Started for " + $p.id);
	MainDB.session.upsert(['_id', req.session.id]).set({
		'profile': $p,
		'createdAt': now
	}).on(() => {
		JLog.info("Session Upsert Completed");
		MainDB.users.findOne(['_id', $p.id]).on(($body) => {
			JLog.info("User FindOne Completed. Found: " + !!$body);
			if ($body) {
				for (let key in $body) {
					if ($body[key] && !$p[key]) $p[key] = $body[key];
				}
				if ($body.nickname) {
					$p.nickname = $body.nickname;
					$p.name = $body.nickname;
					$p.title = $body.nickname;
				}
				MainDB.users.update(['_id', $p.id]).set(['lastLogin', now]).on();
				// CRITICAL: Update the session in DB with the merged profile
				MainDB.session.update(['_id', req.session.id]).set(['profile', $p]).on();
			} else {
				JLog.info("New User - No existing record found");
			}
			req.session.profile = $p;
			done(null, $p);
		});
	});
}

exports.run = (Server, page) => {
	//passport configure
	passport.serializeUser((user, done) => {
		done(null, user);
	});

	passport.deserializeUser((obj, done) => {
		done(null, obj);
	});

	const strategyList = {};

	for (let i in config) {
		try {
			let auth = require(path.resolve(__dirname, '..', 'auth', 'auth_' + i + '.js'))
			Server.get('/login/' + auth.config.vendor, passport.authenticate(auth.config.vendor))
			Server.get('/login/' + auth.config.vendor + '/callback', passport.authenticate(auth.config.vendor, {
				successRedirect: '/',
				failureRedirect: '/loginfail'
			}))
			passport.use(new auth.config.strategy(auth.strategyConfig, auth.strategy(process, MainDB /*, Ajae */)));
			strategyList[auth.config.vendor] = {
				vendor: auth.config.vendor,
				displayName: auth.config.displayName,
				color: auth.config.color,
				fontColor: auth.config.fontColor
			};

			JLog.info(`OAuth Strategy ${i} loaded successfully.`)
		} catch (error) {
			JLog.error(`OAuth Strategy ${i} is not loaded`)
			JLog.error(error.message)
		}
	}

	Server.get("/login", (req, res) => {
		if (global.isPublic) {
			page(req, res, "login", { '_id': req.session.id, 'text': req.query.desc, 'loginList': strategyList });
		} else {
			let now = Date.now();
			let id = req.query.id || "ADMIN";
			let lp = {
				id: id,
				title: "LOCAL #" + id,
				birth: [4, 16, 0],
				_age: { min: 20, max: undefined }
			};
			MainDB.users.findOne(['_id', id]).on(($body) => {
				JLog.info("Login Debug: DB Body found: " + !!$body);
				if ($body) JLog.info("Login Debug: DB Body content: " + JSON.stringify($body));

				if ($body) {
					for (let key in $body) {
						if ($body[key] && !lp[key]) lp[key] = $body[key];
					}
					if ($body.nickname) {
						lp.nickname = $body.nickname;
						lp.name = $body.nickname; // Sync name/title too
						lp.title = $body.nickname;
					}
					JLog.info("Login Debug: Merged Profile: " + JSON.stringify(lp));
					MainDB.users.update(['_id', id]).set(['lastLogin', now]).on();
				} else {
					JLog.info("New Local User - No existing record found. Creating...");
					// Explicitly insert with upsert=true equivalent or just insert ignore
					// Since upsert in collection.js might be weird, let's try strict insert
					// and if it fails (duplicate), we don't care because we'll update next time.
					// But collection.js upsert uses ON CONFLICT DO UPDATE.
					// Let's use the .upsert() method properly.

					// Re-define lp defaults for DB if needed, but for now just inserting ID is enough
					// The user will setup nickname later.

					// MainDB.users.upsert method needs to be called carefully.
					// According to collection.js: my.upsert = function(){ return new pointer("update", query(arguments), { upsert: true }); };
					// But pointer.js update with upsert:true logic:
					// case "upsert": ... INSERT ... ON CONFLICT ...

					MainDB.users.upsert(['_id', id]).set(['lastLogin', now]).on();
				}

				MainDB.session.upsert(['_id', req.session.id]).set(['profile', JSON.stringify(lp)], ['createdAt', now]).on(function ($res) {
					req.session.admin = true;
					req.session.profile = lp;
					res.redirect("/");
				});
			});
		}
	});

	Server.get("/logout", (req, res) => {
		if (!req.session.profile) {
			return res.redirect("/");
		} else {
			req.session.destroy();
			res.redirect('/');
		}
	});

	Server.get("/loginfail", (req, res) => {
		page(req, res, "loginfail");
	});
}