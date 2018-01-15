const krakenApi = require ('kraken-api');
const props = require ('../application-properties');
const bus = require ('./event-bus');
const CallRateLimiter = require ('./helper/kraken-callrate');
const assets = require ('./assets');
const log = require('./helper/logger')(module);

const T_SECOND = 1000;
const T_MINUTE = 60 * T_SECOND;
const T_HOUR = 60 * T_MINUTE;
const T_DAY = 24 * T_HOUR;


const data_cache = {
	serverTime: cachedValue (7 * T_DAY),
	tradables: {},
	tradable_timestamp: 0
};

var singletonInstance = null;

/**
 * @class Kraken
 * @param {SocketIO.Socket} socket 
 * @param {*} auth 
 */
function Kraken (auth) {
	var self = this;
	var callRateLimiter = new CallRateLimiter ();

	if (!auth) {
		if (singletonInstance === null) {
			singletonInstance = this;
		} else {
			throw Error ('Access denied; please use the kraken singleton instance if you don\'t attach it to a socket.');
		}
	} else {
		callRateLimiter.start ();
	}

	var pubkey = (auth ? auth.apikey : '');
	var privkey = (auth?  auth.privkey : '');

	var client = new krakenApi(pubkey, privkey, {
		timeout: props.requestTimeout
	});


	function callAPI (fn, args, callback, numTries) {
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
		function tryit () {
			if (numTries-- <= 0) {
				if (done) return;
				done = true;
				log ('    ...' + fn + '.aborting! ' + (Math.round ((Date.now () - t1) / 100) / 10) + 's');
				callback (lastErr);
			} else {
				callRateLimiter.reduce (cost, () => {
					log ('trying.' + fn + ':' + numTries + '...');
					client.api (fn, args).then (result => {
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

	this.callAPI = callAPI;


	this.serverTime = callback => {
		if (!callback) {
			return data_cache.serverTime.value;
		} else if (!data_cache.serverTime.expired) {
			callback (data_cache.serverTime.value);
		} else {
			callAPI ('Time', null, (err, result) => {
				data_cache.serverTime.value = result.unixtime;
				callback (data_cache.serverTime.value);
			}, 10);
		}
	};


	this.getValueOfTradables = () => {
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

Kraken.singleton = new Kraken ();


const vtRefreshInterval = 30 * 1000;
var vtLastRefresh = Date.now ();
function refreshValuesOfTradables () {
	Kraken.singleton.callAPI ('Ticker', {
		pair: assets.tradablePairs.join (',')
	}, (err, result) => {
		if (err) log (err);
		else {
			for (var pair in result) {
				assets.names.forEach (assetName => {
					var asset = assets[assetName];
					if (asset.pair === pair) {
						data_cache.tradables[assetName] = convertTickerInfo (result[pair]);
					}
				});
			}
			data_cache.tradable_timestamp = Date.now ();
			bus.emit ('values_of_tradable_assets', data_cache.tradables);
		}
		var deltaT = data_cache.tradable_timestamp - vtLastRefresh;
		vtLastRefresh = data_cache.tradable_timestamp;
		setTimeout (refreshValuesOfTradables, Math.max (5000, vtRefreshInterval - deltaT));
	}, 10)
}
setTimeout (refreshValuesOfTradables, 20);

function convertTickerInfo (obj) {
	return {
		ask:  parseFloat (obj.a[0]),
		bid:  parseFloat (obj.b[0]),
		last: parseFloat (obj.c[0]),
		today: {
			low:    parseFloat (obj.l[0]),
			high:   parseFloat (obj.h[0]),
			avg:    parseFloat (obj.p[0]),
			volume: parseFloat (obj.v[0])
		},
		last24h: {
			low:    parseFloat (obj.l[1]),
			high:   parseFloat (obj.h[1]),
			avg:    parseFloat (obj.p[1]),
			volume: parseFloat (obj.v[1])
		}
	};
}


module.exports = Kraken;
