const krakenApi = require ('kraken-api');
const props = require ('../application-properties');
const bus = require ('./event-bus');
const CallRateLimiter = require ('./helper/kraken-callrate');
import assets from './assets';
const log = require('./helper/logger')(module);

const T_SECOND = 1000;
const T_MINUTE = 60 * T_SECOND;
const T_HOUR = 60 * T_MINUTE;
const T_DAY = 24 * T_HOUR;

import Ticker from './types/ticker';

const data_cache : { tradables: { [currency: string]: Ticker }, tradable_timestamp: number } = {
	tradables: {},
	tradable_timestamp: 0
};

var singletonInstance = null;
var timeDrift = 0;

/**
 * @class Kraken
 * @param {SocketIO.Socket} socket 
 * @param {*} auth 
 */
class Kraken {
	private callRateLimiter = new CallRateLimiter ();
	private client;

	public serverTime () {
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

	callAPI (fn, args, callback, numTries) {
		if (props.krakenDisabled) {
			process.nextTick (() => {+
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


	getValueOfTradables = () => {
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


const vtRefreshInterval = 30 * 1000;
var vtLastRefresh = Date.now ();
function refreshValuesOfTradables () {
	try {
		singletonInstance.callAPI ('Ticker', {
			pair: assets.tradablePairs.join (',')
		}, (err, result) => {
			if (err) log (err);
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
				bus.emit ('values_of_tradable_assets', data_cache.tradables);
			}
			var deltaT = data_cache.tradable_timestamp - vtLastRefresh;
			vtLastRefresh = data_cache.tradable_timestamp;
			setTimeout (refreshValuesOfTradables, Math.max (5000, vtRefreshInterval - deltaT));
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
export { singletonInstance as singleton };