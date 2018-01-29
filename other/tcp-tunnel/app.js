const net = require ('net');

function log (msg) {
	console.log ('[node-tunnel]: ' + msg);
}


process.on ('uncaughtException', err => {
	log (err);
});


/**
 * 
 * @param {string} n 
 * @param {string|number} defaultValue
 * @returns {string|number}
 */
function findArg (n, defaultValue) {
	var convert = v => {
		if (defaultValue === false) {
			log (n + ' mode activated');
			return true;
		}
		log (n + ' = ' + v);
		if (typeof (defaultValue) === 'number') return parseFloat (v);
		return v;
	};
	var envArg = n.toUpperCase ();
	if (process.env[envArg]) {
		return convert (process.env[envArg]);
	}
	var longArg = '--' + n.toLocaleLowerCase ();
	if (defaultValue !== false) longArg += '=';
	var shortArg = longArg.substr (1, 2);
	if (defaultValue === false && process.argv[process.argv.length - 1] === shortArg) return convert (true);
	for (var i = 0; i < process.argv.length; i++) {
		if (process.argv[i].startsWith (longArg)) {
			return convert (process.argv[i].substr (longArg.length));
		} else if (i > 0 && process.argv[i - 1] === shortArg) {
			return convert (process.argv[i]);
		}
	}
	return defaultValue;
}

var port = findArg ('port', 27017);
var host = findArg ('host', null);
var secret = findArg ('secret', 'I solemnly swear that I am up to no good');
var tunnelPort = findArg ('tunnel', 9958);
var isServer = findArg ('is-server', false);

var secretBuffer = new Buffer (secret, 'utf8');

var exit = findArg ('exit', false);
const KILL_COMMAND = new Buffer ('exit node-tunnel;', 'utf8');
if (exit) {
	var cc = net.createConnection (tunnelPort, host, () => {
		cc.write (KILL_COMMAND);
		cc.end ();
		log ('killed server');
		process.exit ();
	});
	return;
}

// if (host !== null && (host.startsWith ('127.0.0.') || host === '0.0.0.0' || host === 'localhost')) {
// 	host = null;
// }

process.title = 'node-tunnel:' + port;
log ('running on port ' + port + ':' + typeof (port));

if (host === null) host = 'localhost';

if (isServer) {

	// server mode
	const server = net.createServer (c => {
		var chunks = [];
		var connectionPending = false;
		var connected = false;
		c.on ('data', data => {
			if (connected) return;
			if (connectionPending) {
				chunks.push (data);
				return;
			}
			connectionPending = true;
			if (data.slice (0, KILL_COMMAND.length).equals (KILL_COMMAND)) {
				log ('kill command received');
				process.exit (0);
				return;
			}
			var d = data.slice (0, secretBuffer.length);
			if (d.equals (secretBuffer)) {
				if (data.length > secretBuffer.length) {
					chunks.push (data.slice(secretBuffer.length));
				}
				var cc = net.createConnection (port, host, () => {
					connected = true;
					if (chunks.length > 0) cc.write (Buffer.concat (chunks));
					cc.pipe (c);
					c.pipe (cc);
					c.on ('close', () => {
						cc.end ();
					});
					cc.on ('close', () => {
						c.end ();
					});
				});
				cc.on ('error', err => {
					console.log (err);
					c.end ();
					cc.end ();
				});
				c.on ('error', err => {
					cc.end ();
					c.end ();
				})

			} else {
				log ('wrong password');
				c.end ();
			}
		});
	});
	server.listen (tunnelPort, () => {
		log ('running in server mode');
	});

} else {

	// client mode
	const server = net.createServer (c => {
		console.log ('connection! ' + c.remoteAddress);
		return;
		var id = (''+Date.now ()).substr (10);
		var chunks = [secretBuffer];
		var connected = false;
		c.on ('data', data => {
			if (connected) return;
			chunks.push (data);
		});
		var cc = net.createConnection (tunnelPort, host, () => {
			connected = true;
			cc.write (Buffer.concat (chunks));
			c.pipe (cc);
			cc.pipe(c);
			c.on ('close', () => {
				cc.end ();
			});
			cc.on ('close', () => {
				c.end ();
			});
		});
		cc.on ('error', err => {
			console.log (err);
			cc.end ();
			c.end ();
		});
	});
	server.on ('error', err => {
		console.log (err);
	});
	server.listen (port, () => {
		log ('running in client mode (:' + port + ')');
	});

}
