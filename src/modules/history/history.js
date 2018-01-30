const assets = require ('../assets');
const bus = require ('../event-bus');
const log = require ('../helper/logger') (module);
const fs = require ('fs');
const kraken = require ('../kraken').singleton;
const mongo = require ('../helper/mongo');

const DB_FILE = __dirname + '/db.json';


var history = initHistory ();

/**
 * @returns {{ask:number,bid:number,last:number,today:{low:number,high:number,avg:number,volume:number},last24h:{low:number,high:number,avg:number,volume:number}}}
 */
function AssetDetails () {}

/**
 * @returns {[{ timestamp: number, assets: Object<string,AssetDetails> }]}
 */
function initHistory () {
	return [];
}

// fs.readFile (DB_FILE, 'utf8', (err, data) => {
// 	if (err) throw err;
// 	history = JSON.parse (data);
// });

// function save () {
// 	fs.writeFile (DB_FILE, JSON.stringify (history, null, '\t'), 'utf8', err => {
// 		if (err) throw err;
// 	});
// }

bus.on ('values_of_tradable_assets', values => {
	var now = kraken.serverTime ();
	if (history.length > 0) {
		var lastItem = history[history.length - 1];
		log ('Time since last entry: ' + (Math.round ((lastItem.timestamp - now) / 100) / 10) + 's');
	}
	history.push (values);
});


