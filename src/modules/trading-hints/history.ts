import fs = require ('fs');
import assets from '../assets';
import Logger from '../helper/logger';
const log = Logger (module);
import { mongo, Long } from '../helper/mongo';
import { singleton as kraken, Asset } from '../kraken';
import { Dataset, Data } from './dataset';
import bus from '../event-bus';
import ticker from '../types/ticker';
import props from '../../application-properties';

const T_MINUTES = 60 * 1000;
const T_HOURS = 60 * T_MINUTES;
const T_DAYS = 24 * T_HOURS;

const keepDataFor = 10 * T_DAYS;
const cacheFile = __dirname + '/history-cache.json';

var timeDriftWasUpdated = false;
var importing = true;
bus.on ('timedrift:updated', drift => {
	timeDriftWasUpdated = true;
});

declare interface MongoIntervalData {
	low: number,
	high: number,
	avg: number,
	volume: number
}

declare interface MongoAssetDetails {
	ask: number,
	bid: number,
	last: number,
	today: MongoIntervalData,
	last24h: MongoIntervalData
}

declare interface MongoTickerEntry {
	timestamp: number,
	assets: {
		[currency: string]: MongoAssetDetails
	}
}

var data: Array<MongoTickerEntry> = [];

// data import
fs.exists (cacheFile, exists => {
	if (exists) {
		var t1 = Date.now ();
		fs.readFile (cacheFile, 'utf8', (err, file) => {
			if (err) {
				log (err.stack);
				importDataFromMongoDB ();
			} else {
				try {
					var parsed = JSON.parse ('[' + file + ']');
					function continueWithServerTime () {
						if (kraken.serverTime () - parsed[parsed.length - 1].timestamp > 30000) {
							log ('cached ticker data is stale; triggering full mongoDB import');
							importDataFromMongoDB ();
						} else {
							data.unshift.apply (data, parsed);
							log ('ticker history loaded in ' + (Date.now () - t1) + 'ms');
							importing = false;
						}
					}
					if (timeDriftWasUpdated) continueWithServerTime ();
					else bus.once ('timedrift:updated', continueWithServerTime);
				} catch (err) {
					importDataFromMongoDB ();
				}
			}
		});
	} else {
		importDataFromMongoDB ();
	}
});


function importDataFromMongoDB () {
	mongo (db => {
		var t1 = Date.now ();
		db.collection ('ticker').find ({
			timestamp: {
				$gt: Long.fromNumber (kraken.serverTime () - keepDataFor)
			}
		}).toArray ((err, result) => {
			if (err) throw err;
			var na: Array<MongoTickerEntry> = [];
			result.forEach (item => {
				na.push ({
					timestamp: item.timestamp,
					assets: item.assets
				});
			});
			data.unshift.apply (data, na);
			var stringified = JSON.stringify (data);
			stringified = stringified.substr (1, stringified.length - 2);
			fs.writeFile (cacheFile, stringified, 'utf8', err => {
				if (err) throw err;
				log ('mongo import of ticker data + caching results took ' + (Date.now () - t1) + 'ms');
				importing = false;
			});
		});
	});
}

bus.on ('values_of_tradable_assets', (values: { [currency:string]: ticker }) => {
	var vals = [];
	for (var k in values) {
		vals.push (k);
	}
	data.push ({
		timestamp: kraken.serverTime (),
		assets: values
	});
	// remove first element to prevent the "data[]" array from growing indefinitely
	data.shift ();
	fs.appendFile (cacheFile, ',\n' + JSON.stringify (data[data.length - 1]), 'utf8', err => {
		if (err) log (err.stack, 'red');
	});
});

function getData (since: number): Array<MongoTickerEntry> {
	for (var i = 0; i < data.length; i++) {
		if (data[i].timestamp >= since) {
			return data.slice (i);
		}
	}
	return [];
}

function callbackWhenLoaded (callback: (err: Error) => void) {
	if (importing) {
		setTimeout (() => {
			if (importing) {
				setTimeout (() => {
					if (importing) {
						callback (Error ('still importing; aborting data fetching'));
					} else callback (null); // data found after 10s
				}, 5000);
			} else callback (null); // data found after 5s
		}, 5000);
	} else callback (null); // data found immediately
}

function getAggregatedData (secondsPerBracket : number, bracketCount : number, callback : (err: Error, result: { [currency:string]: Dataset}) => void) {
	callbackWhenLoaded (err => {
		if (err) return callback (err, null);
		var now = kraken.serverTime ();
		var msBracket = secondsPerBracket * 1000;
		var start = now - msBracket * bracketCount;
		var slice = getData (start);
	
		var bracketSlices: Array<Array<MongoTickerEntry>> = [];
		var from = 0;
		var dst = start + msBracket;
		for (var i = 0; i < slice.length - 1; i++) {
			if (slice[i].timestamp >= dst) {
				bracketSlices.push (slice.slice (from, i));
				from = i;
				dst += msBracket;
			}
		}
		bracketSlices.push (slice.slice (from));
	
	
		var cd: { [currency: string]: Array<Data> } = {};
		for (var k in slice[0].assets) {
			cd[k] = [];
		}
	
		/*
			avg: number;
			open: number;
			close: number;
			low: number;
			high: number;
			volume: number;
		*/
	
		bracketSlices.forEach (bracketSlice => {
			for (var k in cd) {
				var lastItem = bracketSlice[0].assets[k];
				var min = lastItem.last, max = min, open = min, vol = 0;
				for (var i = 1; i < bracketSlice.length; i++) {
					var item = bracketSlice[i].assets[k];
					if (item.today.volume > lastItem.today.volume) vol += (item.today.volume - lastItem.today.volume);
					var val = item.last;
					if (val < min) min = val;
					if (val > max) max = val;
					lastItem = item;
				}
				var close = lastItem.last;
				cd[k].push (Data.fromArgs (open, close, min, max, vol));
			}
		});
	
		var res = {};
		for (var k in cd) {
			res[k] = new Dataset (cd[k]);
		}
		callback (null, res);
	});
}

// bus.on ('values_of_tradable_assets', values => {
// 	setTimeout (() => {
// 		var t1 = Date.now ();
// 		getAggregatedData (props.hints.buyAndSellPeriodInMinutes * 60, 120, (err, result) => {
// 			log ('JS aggregation took ' + (Date.now () - t1) + 'ms');
// 			console.log (result.BCH);
// 		});
// 	}, 5000);
// });

export { getAggregatedData };
export default getAggregatedData;
