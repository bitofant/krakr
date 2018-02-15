import assets from '../assets';
import Logger from '../helper/logger';
const log = Logger (module);
import { mongo, Long } from '../helper/mongo';
import { singleton as kraken, Asset } from '../kraken';
import { Dataset, Data } from './dataset';
import bus from '../event-bus';
import { macd, MACDReturnType } from './macd';
import { FullStochasticReturnType, fullStochastic } from './stochastic';

const T_MINUTES = 60 * 1000;
const T_HOURS = 60 * T_MINUTES;
const T_DAYS = 24 * T_HOURS;


declare interface DataPerAsset {
	[currency: string]: Data
}

declare interface MongoDayDetails {
	startOfDay: number,
	date: string,
	assets: DataPerAsset
}

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


const daysHistory : Array<MongoDayDetails> = [];


function getStartOfDay (now : number) : number {
	var d = new Date (now);
	var delta = d.getMilliseconds ();
	delta += 1000 * d.getSeconds ();
	delta += 1000 * 60 * d.getMinutes ();
	delta += 1000 * 60 * 60 * d.getHours ();
	return now - delta;
}


function getDayFromMongo (startOfDay: number, callback: (err: Error, day: DataPerAsset) => void) {
	mongo (db => {
		var ticker = db.collection ('ticker');
		ticker.aggregate ([
			{
				$match: {
					timestamp: {
						$gte: Long.fromNumber (startOfDay),
						$lt: Long.fromNumber (startOfDay + T_DAYS)
					}
				}
			}, {
				$group: {
					_id: null,
					first: { $first: '$$ROOT' },
					last:  { $last:  '$$ROOT' }
				}
			}
		]).toArray ((err, result) => {
			if (err) {
				callback (err, null);
				return;
			}
			var first: MongoTickerEntry = result[0].first,
					last:  MongoTickerEntry = result[0].last;
			var timeDif = last.timestamp - first.timestamp;
			if (Math.abs ((timeDif - T_DAYS) / T_DAYS) > .1) {
				log (Error ('trying to import a day with only ' + (Math.round ((last.timestamp - first.timestamp) / T_HOURS * 100) / 100) + ' hours span').stack, 'red');
			}
			var res: DataPerAsset = {};
			for (var k in first.assets) {
				var f = first.assets[k], l = last.assets[k];
				res[k] = new Data ({
					avg: l.last24h.avg,
					first: f.last,
					last: l.last,
					min: l.last24h.low,
					max: l.last24h.high,
					volume: [0, l.last24h.volume]
				})
			}
			callback (null, res);
		});
	});
}


function getFirstTickerEntryEver (callback: (err: Error, entry: MongoTickerEntry) => void) {
	mongo (db => {
		db.collection ('ticker').findOne ({}, (err, doc) => {
			if (err) callback (err, null);
			else callback (null, doc);
		});
	});
}


function calcMissingDays (since: number) {
	var t = getStartOfDay (since);
	var today = getStartOfDay (kraken.serverTime ());
	mongo (db => {
		var daysDB = db.collection ('days');
		function nextDay () {
			var d = new Date (t);
			getDayFromMongo (t, (err, day) => {
				if (err) throw (err);
				daysHistory.push ({
					startOfDay: t,
					date: d.getFullYear () + '-' + (d.getMonth () < 9 ? '0' : '') + (d.getMonth () + 1) + '-' + (d.getDate () < 10 ? '0' : '') + d.getDate (),
					assets: day
				});
				daysDB.insertOne (daysHistory[daysHistory.length - 1], err => {
					if (err) throw err;
				});
				t += T_DAYS;
				if (t >= today) {
					log ('done calculating days', 'yellow');
				} else {
					nextDay ();
				}
			});
		}
		nextDay ();
	});
}


function importMongoDays () {
	mongo (db => {
		db.collection ('days').find ({}).toArray ((err, arr) => {
			if (err) return log (err.stack, 'red');
			if (arr.length === 0) {
				getFirstTickerEntryEver ((err, entry) => {
					if (err) throw err;
					calcMissingDays (entry.timestamp);
				});
				return;
			}
			arr.forEach (item => {
				daysHistory.push ({
					startOfDay: item.startOfDay,
					date: item.date,
					assets: item.assets
				});
			});
			checkForMissingDays ();
		});
	});
}


function checkForMissingDays () {
	var lastStartOfDay = daysHistory[daysHistory.length - 1].startOfDay;
	if (getStartOfDay (kraken.serverTime ()) > lastStartOfDay + T_DAYS) {
		log ('found missing days', 'red');
		calcMissingDays (lastStartOfDay + T_DAYS);
	}
}

function tomorrow (callback: ()=>void) {
	var now = kraken.serverTime ();
	var tomorrowMorning = getStartOfDay (now) + T_DAYS;
	setTimeout (() => {
		callback ();
	}, tomorrowMorning - now + 100);
}


function getDataset (currency: string) {
	var data : Array<Data> = [];
	for (var i = 0; i < daysHistory.length; i++) {
		data.push (daysHistory[i].assets[currency]);
	}
	return new Dataset (data);
}


function getDays (numdays: number, callback : (err: Error, dataset: Dataset) => void) {
	var now = kraken.serverTime ();
	var startOfDay = getStartOfDay (now - T_DAYS);
	log (new Date (startOfDay).toString (), 'magenta');
	
}



bus.once ('timedrift:updated', drift => {

	// import mongo days
	importMongoDays ();

	// recalculate the last day every 24h at midnight
	setInterval (() => {
		// timer triggers every 24h but at a random time during the day
		// => defer execution until midnight
		tomorrow (checkForMissingDays);
	}, T_DAYS);

});


function CachedFunction (fn: (dataset: Dataset, arg1:number, arg2:number, arg3:number)=>void, a1:number, a2:number, a3:number): (currency: string)=>any {
	var lastRecalc = 0;
	var result = null;
	return (currency: string) => {
		if (daysHistory.length !== lastRecalc) result = null;
		if (result === null) {
			var dataset = getDataset (currency);
			result = fn (dataset, a1, a2, a3);
		}
		return result;
	};
}


function CachedMACD (fastLength:number, slowLength:number, smooth:number): (currency: string) => MACDReturnType {
	return CachedFunction (macd, fastLength, slowLength, smooth);
}

function CachedStochastic (period:number, periodK:number, periodD:number): (currency: string) => FullStochasticReturnType {
	return CachedFunction (fullStochastic, period, periodK, periodD);
}


const longtermHistory = {
	macd: {
		fast: CachedMACD ( 4, 16, 9),
		mid:  CachedMACD ( 6, 19, 9),
		slow: CachedMACD (12, 26, 9),
	},
	stochastic: {
		fast: CachedStochastic (14 ,4, 4),
		mid:  CachedStochastic (31 ,4, 4),
		slow: CachedStochastic (75 ,4, 4)
	}
};

export { longtermHistory };
export default longtermHistory;
