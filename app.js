const fs = require ('fs');
const express = require ('express');
const app = express ();
const server = require ('http').createServer (app);
const io = require ('socket.io') (server);
const port = process.env.HTTP_PORT || 8071;
const kraken = require ('./modules/kraken').singleton;

const UserSession = require ('./modules/user-session');
const bus = require ('./modules/event-bus');

app.use (express.static ('./htdocs'));

server.listen (port, () => {
	console.log ('App listening on port ' + server.address ().port);
});

var reloadUntil = Date.now () + 5000;

fs.watchFile (__dirname + '/htdocs/bundle.js', () => {
	io.emit ('refresh');
})

io.on ('connection', socket => {
	console.log ('New socket connection!');

	// if (Date.now () < reloadUntil) {
	// 	reloadUntil = 0;
	// 	setTimeout (() => {
	// 		socket.emit ('refresh');
	// 	}, 500);
	// }
	
	socket.on ('auth', auth => {
		new UserSession (socket, auth);
		socket.emit ('auth:success');
	});

});
