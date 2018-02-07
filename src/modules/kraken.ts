const krakenApi = require ('kraken-api');
import props from '../application-properties';
import bus from './event-bus';
import CallRateLimiter from './helper/kraken-callrate';
import assets from './assets';
import logger from './helper/logger';
const log = logger (module);

const T_SECOND = 1000;
const T_MINUTE = 60 * T_SECOND;
const T_HOUR = 60 * T_MINUTE;
const T_DAY = 24 * T_HOUR;

import Ticker from './types/ticker';

const data_cache : { tradables: { [currency: string]: Ticker }, tradable_timestamp: number } = {
	tradables: {},
	tradable_timestamp: 0
};

var singletonInstance : Kraken = null;
var timeDrift = 0;




declare interface IntervalDetails {
	low: number,
	high: number,
	avg: number,
	volume: number
}
declare interface Asset {
	ask: number,
	bid: number,
	last: number,
	today: IntervalDetails,
	last24h: IntervalDetails
}



class Kraken {
	private callRateLimiter = new CallRateLimiter ();
	private client;

	public serverTime () : number {
			return Date.now () + timeDrift;
	}

	constructor (auth?) {
		var self = this;

		if (!auth) {
			if (singletonInstance === null) {
				singletonInstance = this;
			} else {
				throw Error ('Access denied; please use the kraken singleton instance if you don\'t attach it to a socket.');
			}
		} else {
			this.callRateLimiter.start ();
		}

		var pubkey = (auth ? auth.apikey : '');
		var privkey = (auth?  auth.privkey : '');

		this.client = new krakenApi(pubkey, privkey, {
			timeout: props.requestTimeout
		});
	}

	callAPI (fn: string, args: any, callback: (err:Error,result?:any)=>void, numTries: number) {
		if (props.krakenDisabled) {
			process.nextTick (() => {
				callback (new Error ('Kraken unavailable'));
			});
			return;
		}
		// place / cancel order: 0
		// anything else: 1
		// ledger / trade history: 2
		if (!numTries || numTries < 1) numTries = 1;
		var cost = (fn === 'Ledgers' ? 2 : 1);
		var t1 = Date.now ();
		var lastErr = null;
		var done = false;
		var self = this;
		function tryit () {
			if (numTries-- <= 0) {
				if (done) return;
				done = true;
				log ('    ...' + fn + '.aborting! ' + (Math.round ((Date.now () - t1) / 100) / 10) + 's');
				callback (lastErr);
			} else {
				self.callRateLimiter.reduce (cost, () => {
					log ('trying.' + fn + ':' + numTries + '...');
					self.client.api (fn, args).then (result => {
						if (done) return;
						done = true;
						log ('    ...' + fn + '.success! ' + (Math.round ((Date.now () - t1) / 100) / 10) + 's');
						callback (null, result.result);
					}).catch (err => {
						if (done) return;
						log ('    ...' + fn + '.error!');
						log (err.stack);
						lastErr = err;
						tryit ();
					});
				});
			}
		}
		tryit ();
	}


	// this.serverTime = callback => {
	// 	if (!callback) {
	// 		return data_cache.serverTime.value;
	// 	} else if (!data_cache.serverTime.expired) {
	// 		callback (data_cache.serverTime.value);
	// 	} else {
	// 		callAPI ('Time', null, (err, result) => {
	// 			data_cache.serverTime.value = result.unixtime;
	// 			callback (data_cache.serverTime.value);
	// 		}, 10);
	// 	}
	// };


	getValueOfTradables (): { [currency: string]: Ticker } {
		return Object.assign ({ lastUpdate: Date.now () - data_cache.tradable_timestamp }, data_cache.tradables);
	};



}


/**
 * 
 * @param {number} maxAge 
 * @param {*} value 
 * @returns {{value:*,expired:boolean}}
 */
function cachedValue (maxAge, value) {
	var obj = {};
	var nextRefresh = Date.now () + maxAge;
	if (arguments.length < 2) {
		value = null;
		nextRefresh = 0;
	}
	var v = value;
	Object.defineProperty (obj, 'value', {
		get: () => { return v; },
		set: newValue => {
			v = newValue;
			nextRefresh = Date.now () + maxAge;
		}
	});
	Object.defineProperty (obj, 'expired', {
		get: () => { return Date.now () > nextRefresh; }
	});
	return obj;
}

singletonInstance = new Kraken ();


var vtLastRefresh = Date.now ();
function refreshValuesOfTradables () {
	log ('refreshValuesOfTradables();');
	try {
		var tstart = Date.now ();
		singletonInstance.callAPI ('Ticker', {
			pair: assets.tradablePairs.join (',')
		}, (err, result) => {
			if (err) log (err.stack);
			else {
				for (var pair in result) {
					assets.names.forEach (assetName => {
						var asset = assets[assetName];
						if (asset.pair === pair) {
							data_cache.tradables[assetName] = new Ticker (result[pair]);
						}
					});
				}
				data_cache.tradable_timestamp = Date.now ();
				try {
					process.nextTick (() => {
						bus.emit ('values_of_tradable_assets', data_cache.tradables);
					});
				} catch (err) {
					console.log (err);
					log ('error dispatching event bus.emit("values_of_tradable_assets", {...}) !', 'red');
				}
			}
			var deltaT = data_cache.tradable_timestamp - tstart;
			vtLastRefresh = data_cache.tradable_timestamp;
			setTimeout (refreshValuesOfTradables, Math.max (5000, props.tickerRefreshInterval - deltaT));
		}, 10);
	} catch (e) {
		console.log (e);
	}
}


function updateTimeDrift (callback) {
	singletonInstance.callAPI ('Time', null, (err, result) => {
		if (err) throw (err);
		timeDrift = (result.unixtime * 1000) - Date.now ();
		if (callback) callback ();
	}, 10);
}

setTimeout (() => {
	updateTimeDrift (refreshValuesOfTradables);
}, 1000);



export default Kraken;
export { singletonInstance as singleton, Kraken, Asset };
