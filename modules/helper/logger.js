const props = require ('../../application-properties');

const colors = {
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

var maxNameLength = 0;

var log = [];
function logEntry (name, timestamp, msg) {
	log.push ({
		n: name,
		t: timestamp,
		m: msg
	});
}

function Logger (loggerID, defaultColor) {
	var name = '';
	if (typeof (loggerID) === 'string') name = loggerID;
	else if (loggerID.filename) {
		name = loggerID.filename;
		name = name.substr (name.lastIndexOf ('/') + 1);
		if (name.endsWith ('.js')) name = name.substr (0, name.length - 3);
	}
	if (name.length > maxNameLength) maxNameLength = name.length;
	var defaultCol = colors[defaultColor] || defaultColor || '';
	/**
	 * 
	 * @param {string} msg 
	 * @param {"black"|"red"|"green"|"yellow"|"blue"|"magenta"|"cyan"|"white"|"dim"} color 
	 */
	function Log (msg, color) {
		var d = new Date ();
		logEntry (name, d.getTime (), msg);
		var c = colors[color] || color || defaultCol;
		console.log (c + '[' + timestamp (d) + '|' + fixedLengthString (name, maxNameLength, '.') + ']: ' + msg + (c === '' ? '' : colors.reset));
	}
	Log.black   = colors.black;
	Log.red     = colors.red;
	Log.green   = colors.green;
	Log.yellow  = colors.yellow;
	Log.blue    = colors.blue;
	Log.magenta = colors.magenta;
	Log.cyan    = colors.cyan;
	Log.white   = colors.white;
	Log.dim     = colors.dim;
	Log.reset   = colors.reset;
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


const baseJS = (function () {
	function script () {
		var basePath = location.href;
		if (!basePath.endsWith ('/')) basePath += '/';
		$.ajax (basePath + 'since/0', {
			success: data => {
				console.log (data);
			}
		});
	}
	var s = script.toString ();
	s = s.substr (s.indexOf ('{') + 1);
	s = s.substr (0, s.length - 1);
	return s;
}) ();

const baseHTML = (function () {
	var ret = '<!DOCTYPE html>\r\n<html lang="en"><head><meta charset="utf-8">';
	ret += '<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">';
	[
		'https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0-beta.3/css/bootstrap.min.css'
	].forEach (src => {
		ret += '<link rel="stylesheet" href="' + src + '" crossorigin="anonymous">';
	})
	ret += '<title>Log</title></head><body><div class="container-fluid"><h1>Log</h1>';
	ret += '<table class="table"><thead><th>Date</th><th>Time</th><th>Logger</th><th>Message</th></thead><tbody id="content">';
	ret += '</tbody></table></div>';
	[
		'https://code.jquery.com/jquery-3.2.1.min.js',
		'https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.12.9/umd/popper.min.js',
		'https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0-beta.3/js/bootstrap.min.js'
	].forEach (src => {
		ret += '<script src="' + src + '"' + (src.startsWith ('http') ? ' crssorigin="anonymous"' : '') + '></script>';
	});
	ret += '<script>' + baseJS + '</script></body></html>';
	return ret;
}) ();


/**
 * 
 * @param {Request} req 
 * @param {*} res 
 * @param {*} next 
 */
Logger.express = (req, res, next) => {
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


module.exports = Logger;