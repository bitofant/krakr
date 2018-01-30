import props from './application-properties';
import fs = require ('fs');

import express = require ('express');
const app = express ();

import http = require ('http');
const server = http.createServer (app);

import socketIO = require ('socket.io');
const io = socketIO (server);

import { singleton as kraken} from './modules/kraken';
// const cryptowatch = require ('./modules/cryptowat.ch/cryptowatch');
console.log ('importing history');
import history from './modules/history/history';
history.a = 'C';
import findUser from './modules/user/user';
import loadUsers from './modules/user/user-loader';
import UserSession from './modules/user/user-session';
import bus from './modules/event-bus';

import { Logger, express as logger_express } from './modules/helper/logger';
const log = Logger(module);

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
	console.log (err);
});
