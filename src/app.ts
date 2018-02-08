import props from './application-properties';
import fs = require ('fs');

import express = require ('express');
const app = express ();

import http = require ('http');
const server = http.createServer (app);

import socketIO = require ('socket.io');
const io = socketIO (server);

import { singleton as kraken} from './modules/kraken';
import history from './modules/history/history';
history.a = 'C';
import findUser from './modules/user/user';
import loadUsers from './modules/user/user-loader';
import UserSession from './modules/user/user-session';
import bus from './modules/event-bus';

import { Logger, express as logger_express } from './modules/helper/logger';
const log = Logger(module);

import hints from './modules/trading-hints/hints';
import { mongo, Long } from './modules/helper/mongo';
import ticker from './modules/types/ticker';
import { sendMail } from './modules/helper/sendmail';
hints.a = 'c';

app.use (express.static (__dirname + '/htdocs'));
app.use ('/log/', logger_express);


bus.once ('values_of_tradable_assets', () => {
	log ('got asset values!');
	server.listen (props.port, () => {
		log ('App listening on port ' + server.address ().port, 'red');
		loadUsers ();
	});
});

var reloadUntil = Date.now () + 5000;

if (props.env.dev) {
	fs.watchFile (__dirname + '/htdocs/bundle.js', () => {
		io.emit ('refresh');
	});
}

io.on ('connection', socket => {
	log ('New socket connection!');
	
	socket.on ('auth', auth => {
		if (auth.apikey && auth.apikey.length === 56 && auth.privkey && auth.privkey.length === 88) {
			new UserSession (socket, auth);
			socket.emit ('auth:success');
		} else {
			setTimeout (() => {
				socket.emit ('auth:failed', 'Invalid API and/or private key provided.');
			}, 500);
		}
	});

	socket.on ('getauth', name => {
		var u = findUser (name);
		if (u !== null) socket.emit ('auth:override', u);
	});

});

process.on ('uncaughtException', err => {
	console.log ('### UNCAUGHT EXCEPTION ###');
	log ('### UNCAUGHT EXCEPTION ###');
	log (err.stack);
});


// const SENDER_MAIL_ADDR = ['"qod','" <qo-r','ply' + String.fromCharCode(64) + 'riuqa.d','>'].join ('e').split('q').join('n');
const SENDER_MAIL_ADDR = ['jt',['','',''].join('s'),String.fromCharCode(64)+'d.xmg'.split('').reverse().join(''),''].join ('e');
const TO_MAIL_ADDR = '"Joeran Tesse" <' + ['jo','rant', ['', '', ''].join('s'),String.fromCharCode(64)+['g',['oc','lia'].join('.').split('').reverse().join(''),''].join('m')].join ('e') + '>';

mongo (db => {
	var events = db.collection ('events');
	var buyValues: { [currency:string]:number } = {};
	var buyTimes: { [currency:string]:number } = {};
	bus.on ('buy', currency => {
		log ('buy<' + currency + '>', 'green');
		var values = kraken.getValueOfTradables ();
		buyValues[currency] = values[currency].last;
		buyTimes[currency] = kraken.serverTime ();
		events.insertOne ({
			'type': 'BUY',
			'c': currency,
			'buy': buyValues[currency],
			'sell': 0,
			'profit_%': 0,
			'time': Long.fromNumber (kraken.serverTime ()),
			'hodld': 0
		});
		sendMail ({
			from: SENDER_MAIL_ADDR,
			to: TO_MAIL_ADDR,
			subject: 'API: buy ' + currency,
			html: 'Buy ' + currency + ' for ' + buyValues[currency] + '€ at ' + new Date (buyTimes[currency])
		}, err => {
			if (err) throw err;
			log ('mail sent!');
		});
	});
	bus.on ('sell', currency => {
		log ('sell<' + currency + '>', 'red');
		var values = kraken.getValueOfTradables();
		var currentValue = values[currency].last;
		var boughtValue = buyValues[currency] || currentValue;
		var profit = currentValue - boughtValue;
		var pctProfit = profit / boughtValue;
		var now = kraken.serverTime ();
		var hodld = now - buyTimes[currency];
		events.insertOne ({
			'type': 'SELL',
			'c': currency,
			'buy': buyValues[currency],
			'sell': currentValue,
			'profit_%': pctProfit * 100,
			'time': Long.fromNumber (now),
			'hodld': Long.fromNumber (hodld)
		});
		sendMail ({
			from: SENDER_MAIL_ADDR,
			to: TO_MAIL_ADDR,
			subject: 'API: sell ' + currency,
			html: 'Sell ' + currency + ' for ' + currentValue + '€ after hodling for ' + Math.round (hodld / 1000) + 's making ' + (Math.round (pctProfit * 1000) / 10) + '%'
		}, err => {
			if (err) throw err;
			log ('mail sent!');
		});
	});
});
