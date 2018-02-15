import https = require ('https');
import assets from '../assets';
import Logger from '../helper/logger';
import { Data } from '../trading-hints/dataset';
import { mongo } from '../helper/mongo';
import { Long } from 'bson';
const log = Logger (module);

declare interface CryptowatchEntry {
	CloseTime: number,
	OpenPrice: number,
	HighPrice: number,
	LowPrice: number,
	ClosePrice: number,
	Volume: number
}

declare interface DataPerAsset {
	[currency: string]: Data
}

declare interface MongoDayDetails {
	startOfDay: number | Long,
	date: string,
	assets: DataPerAsset
}

function createRequester (url): (currency: string, callback: (err: Error, result)=>void)=>void {
	var urlS = url.split (':symbol:');
	return (currency, callback) => {
		var symbol = assets[currency].cryptowatch.symbol;
		log (urlS.join (symbol));
		https.request (urlS.join (symbol), res => {
			var chunks = [];
			res.on ('data', chunk => {
				chunks.push (chunk);
			});
			res.on ('end', () => {
				var result = JSON.parse (Buffer.concat (chunks).toString ('utf8'));
				callback (null, result.result);
			});
			res.on ('error', err => {
				callback (err, null);
			});
		}).end ();
	};
}


function getOHLC (since: number, period: "1m"|"3m"|"5m"|"15m"|"30m"|"1h"|"2h"|"4h"|"6h"|"12h"|"3d"|"1w"|"1d", callback: (err: Error, result: { [currency:string]: Array<CryptowatchEntry> })=>void) {
	var np = '86400';
	switch (period) {
		case '1m':  np = '60'; break;
		case '3m':  np = '180'; break;
		case '5m':  np = '300'; break;
		case '15m': np = '900'; break;
		case '30m': np = '1800'; break;
		case '1h':  np = '3600'; break;
		case '2h':  np = '7200'; break;
		case '4h':  np = '14400'; break;
		case '6h':  np = '21600'; break;
		case '12h': np = '43200'; break;
		case '1d':  np = '86400'; break;
		case '3d':  np = '259200'; break;
		case '1w':  np = '604800'; break;
	}
	var reqOHLC = createRequester ('https://api.cryptowat.ch/markets/kraken/:symbol:eur/ohlc?periods=' + np + '&after=' + (since / 1000 | 0));
	var missing = 1;
	var res = {};
	assets.tradableNames.forEach (currency => {
		missing++;
		reqOHLC (currency, (err, result) => {
			if (missing == -2) return;
			if (err) {
				missing = -2;
				callback (err, null);
				return;
			}
			var a = [];
			result[np].forEach (item => {
				var obj = {};
				['CloseTime', 'OpenPrice', 'HighPrice', 'LowPrice', 'ClosePrice', 'Volume'].forEach ((name, i) => {
					obj[name] = item[i];
				});
				a.push (obj);
			});
			res[currency] = a;
			if (--missing <= 0) callback (null, res);
		});
	});
	missing--;
}

function importOldDataFromCryptoWatch () {
	getOHLC (new Date ('Sep 1 2017 01:00:00 GMT+0100 (CET)').getTime (), '1d', (err, result) => {
		var res : Array<MongoDayDetails> = [];
		for (var i = 0; i < result.BCH.length; i++) {
			var tstart = (result.BCH[i].CloseTime - 24 * 60 * 60) * 1000;
			var d = new Date (tstart);
			var entry: MongoDayDetails = {
				startOfDay: Long.fromNumber (tstart),
				date: d.getFullYear () + '-' + (d.getMonth () < 9 ? '0' : '') + (d.getMonth () + 1) + '-' + (d.getDate () < 10 ? '0' : '') + d.getDate (),
				assets: {}
			};
			if (entry.date === '2018-01-31') break;
			for (var k in result) {
				var item = result[k][i];
				entry.assets[k] = Data.fromArgs (item.OpenPrice, item.ClosePrice, item.LowPrice, item.HighPrice, item.Volume);
			}
			res.push (entry);
		}
		mongo (db => {
			var daysDB = db.collection ('days');
			daysDB.insertMany (res, err => {
				if (err) throw err;
			});
		});
	});
}

// importOldDataFromCryptoWatch ();
