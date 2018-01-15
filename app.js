const props = require ('./application-properties');
const fs = require ('fs');
const express = require ('express');
const app = express ();
const server = require ('http').createServer (app);
const io = require ('socket.io') (server);
const kraken = require ('./modules/kraken').singleton;

const loadUsers = require ('./modules/user/user-loader');
const UserSession = require ('./modules/user/user-session');
const bus = require ('./modules/event-bus');

const logger = require ('./modules/helper/logger');
const log = logger (module);

app.use (express.static ('./htdocs'));
app.use ('/log/', logger.express);


server.listen (props.port, () => {
	log ('App listening on port ' + server.address ().port);
	loadUsers ();
});

var reloadUntil = Date.now () + 5000;

fs.watchFile (__dirname + '/htdocs/bundle.js', () => {
	io.emit ('refresh');
})

io.on ('connection', socket => {
	log ('New socket connection!');
	
	socket.on ('auth', auth => {
		new UserSession (socket, auth);
		socket.emit ('auth:success');
	});

});

process.on ('uncaughtException', err => {
	console.log (err);
});
