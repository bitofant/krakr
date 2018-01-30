console.log ('history import!');

import assets from '../assets';
import bus from '../event-bus';
import Logger from '../helper/logger';
const log = Logger (module);
import fs = require ('fs');
import { singleton as kraken, Asset } from '../kraken';
import mongo from '../helper/mongo';

const DB_FILE = __dirname + '/db.json';

var history : Array<{timestamp: number, assets: {[currency: string]: Asset}}> = [];

// fs.readFile (DB_FILE, 'utf8', (err, data) => {
// 	if (err) throw err;
// 	history = JSON.parse (data);
// });

// function save () {
// 	fs.writeFile (DB_FILE, JSON.stringify (history, null, '\t'), 'utf8', err => {
// 		if (err) throw err;
// 	});
// }


mongo (db => {
	var hist = db.collection ('ticker');
	bus.on('values_of_tradable_assets', (values : {[currency: string]: Asset}) => {
		var now = kraken.serverTime ();
		if (history.length > 0) {
			var lastItem = history[history.length - 1];
			log ('Time since last entry: ' + (Math.round ((lastItem.timestamp - now) / 100) / 10) + 's');
		}
		var stampedValues = {
			timestamp: now,
			assets: values
		};
		history.push (stampedValues);
		hist.insertOne (stampedValues, (err, result) => {
			if (err) throw err;
			//console.log (result);
		});
	});
})


export default {'a': 'B'};
