import fs = require ('fs');
const props = require ('../../application-properties');
const MAX_LOG_LENGTH = 50000;
const LOG_CHOP_SIZE = 1000;
const logfile = __dirname + '/logger.log';

const colors : {[name : string]: string} = {
	black:   '\x1b[30m',
	red:     '\x1b[31m',
	green:   '\x1b[32m',
	yellow:  '\x1b[33m',
	blue:    '\x1b[34m',
	magenta: '\x1b[35m',
	cyan:    '\x1b[36m',
	white:   '\x1b[37m',
	dim:     '\x1b[2m',
	reset:   '\x1b[0m'
};

var maxNameLength : number = 0;

var log : Array<{ n:string, t:number, m:string, c:string }> = [];

var persistance: { fullRewrite:()=>void } = new (function () {
	var lastPersistedLogEntry = 0;
	fs.exists (logfile, exists => {
		if (exists) {
			var t1 = Date.now ();
			fs.readFile (logfile, 'utf8', (err, data) => {
				if (err) console.error (err);
				var t2 = Date.now ();
				var oldLog = log;
				log = JSON.parse ('[' + data + ']');
				lastPersistedLogEntry = log[log.length - 1].t;
				oldLog.forEach (item => {
					log.push (item);
				});
				logEntry ('logger', Date.now (), 'log deserialized; file read in ' + (t2 - t1) + 'ms, ' + log.length + ' lines parsed in ' + (Date.now () - t2) + 'ms', colors.yellow);
			});
		} else {
			fs.writeFile (logfile, '{"n":"logger","t":' + Date.now () + ',"m":"logfile initialized","c":"#49f"}', 'utf8', err => {
				if (err) console.error (err);
			});
		}
	})
	setInterval (() => {
		if (log.length === 0) return;
		var t1 = Date.now ();
		var ind = log.length - 1;
		while (log[ind].t > lastPersistedLogEntry) ind--;
		if (ind === log.length - 1) return;
		lastPersistedLogEntry = log[log.length - 1].t;
		var newLogEntries = log.slice (ind + 1);
		if (newLogEntries.length === 1 && newLogEntries[0].n === 'logger') return;
		var d = JSON.stringify (newLogEntries);
		d = d.substr (1, d.length - 2);
		d = ',\n' +  d.split ('"},{"').join ('"},\n{"');
		fs.appendFile (logfile, d, 'utf8', err => {
			if (err) console.error (err);
			// var mem = process.memoryUsage ();
			// var memUsage = Math.round (mem.heapUsed / mem.heapTotal * 1000) / 10;
			// logEntry ('logger', Date.now (), 'log serialization took ' + (Date.now () - t1) + 'ms for ' + newLogEntries.length + ' entries, ram=' + (Math.round (mem.heapUsed / 1024 / 1024 * 10) / 10) + 'mb', 'white');
		});
	}, 5000);
	this.fullRewrite = () => {
		var t1 = Date.now ();
		var d = JSON.stringify (log);
		d = d.substr (1, d.length - 2);
		d = d.split ('"},{"').join ('"},\n{"');
		fs.writeFile (logfile, d, 'utf8', err => {
			if (err) console.error (err);
			var mem = process.memoryUsage ();
			var memUsage = Math.round (mem.heapUsed / mem.heapTotal * 1000) / 10;
			logEntry ('logger', Date.now (), 'log serialization took ' + (Date.now () - t1) + 'ms for ' + log.length + ' entries, ram=' + (Math.round (mem.heapUsed / 1024 / 1024 * 10) / 10) + 'mb', 'white');
		});
	};
}) ();

function logEntry (name, timestamp, msg, color) {
	var c = 'white';
	for (var k in colors) {
		if (colors[k] === color) {
			c = k;
			break;
		}
	}
	log.push ({
		n: name,
		t: timestamp,
		m: msg,
		c: c
	});
	if (log.length > MAX_LOG_LENGTH) {
		log.splice (0, LOG_CHOP_SIZE);
		persistance.fullRewrite ();
	}
}

function Logger (loggerID : any, defaultColor : any=null) {
	var name = '';
	if (typeof (loggerID) === 'string') name = loggerID;
	else if (loggerID.filename) {
		name = loggerID.filename;
		name = name.substr (name.lastIndexOf ('/') + 1);
		if (name.endsWith ('.js')) name = name.substr (0, name.length - 3);
	}
	if (name.length > maxNameLength) maxNameLength = name.length;
	var defaultCol = colors[defaultColor] || defaultColor || '';

	function Log (msg : string, color : string=null) {
		var d = new Date ();
		var c = colors[color] || color || defaultCol;
		var cr = c === '' ? '' : colors.reset;
		logEntry (name, d.getTime (), msg, c);
		console.log (c + timestamp (d) + cr + c + '|' + fixedLengthString (name, maxNameLength, '.') + cr + c + ': ' + msg + cr);
	}
	return Log;
}

function timestamp (d) {
	return digits (d.getHours (),   2) + ':' +
				 digits (d.getMinutes (), 2) + ':' +
				 digits (d.getSeconds (), 2) + colors.dim + '.' +
				 digits (d.getMilliseconds (), 3) + colors.reset;
}

function digits (n, digits) {
	var sn = ('' + n);
	while (sn.length < digits) sn = '0' + sn;
	return sn;
}

function fixedLengthString (str, len, fillChar) {
	if (!fillChar) fillChar = ' ';
	var s = ('' + str);
	var se = '';
	for (var i = s.length; i < len; i++) se += fillChar;
	if (fillChar !== ' ') se = colors.dim + se + colors.reset;
	return s + se;
}





function express (req: Request, res, next) {
	if (req.url === '/') {
		var path = __dirname.substr (0, __dirname.indexOf ('/dist') + 5);
		res.sendFile (path + '/htdocs/log.html');
	} else if (req.url.startsWith ('/since/')) {
		var t1 = parseInt (req.url.substr ('/since/'.length));
		for (var i = 0; i < log.length; i++) {
			if (log[i].t > t1) {
				res.json (log.slice (i));
				return;
			}
		}
		res.json ([]);
	} else {
		next ();
	}
};

export { Logger, express, colors };
export default Logger;
