const props = require ('../../application-properties');
const MAX_LOG_LENGTH = 1500;
const LOG_CHOP_SIZE = 100;

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

var log : Array<{ n:string, t:number, m:string }> = [];

function logEntry (name, timestamp, msg) {
	log.push ({
		n: name,
		t: timestamp,
		m: msg
	});
	if (log.length > MAX_LOG_LENGTH) {
		log.splice (0, LOG_CHOP_SIZE);
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
		logEntry (name, d.getTime (), msg);
		var c = colors[color] || color || defaultCol;
		var cr = c === '' ? '' : colors.reset;
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


const baseHTML = `<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="utf-8">
		<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
		<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0-beta.3/css/bootstrap.min.css" crossorigin="anonymous">
		<title>Log</title>
	</head>
	<body>
		<div class="container-fluid">
			<h1>Log</h1>
			<table class="table">
				<thead>
					<th>Date</th>
					<th>Time</th>
					<th>Logger</th>
					<th>Message</th>
				</thead>
				<tbody id="content"></tbody>
			</table>
		</div>
		<script src="https://code.jquery.com/jquery-3.2.1.min.js" crssorigin="anonymous"></script>
		<script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.12.9/umd/popper.min.js" crssorigin="anonymous"></script>
		<script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0-beta.3/js/bootstrap.min.js" crssorigin="anonymous"></script>
		<script>
			var basePath = location.href;
			if (!basePath.endsWith ('/')) basePath += '/';
			$.ajax (basePath + 'since/0', {
				success: data => {
					console.log (data);
				}
			}
		</script>
	</body>
</html>`;


/**
 * 
 * @param {Request} req 
 * @param {*} res 
 * @param {*} next 
 */
function express (req, res, next) {
	console.log (req.url);
	if (req.url === '/') {
		res.send (baseHTML);
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