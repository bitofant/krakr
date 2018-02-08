import assets from '../assets';
import Logger from '../helper/logger';
const log = Logger (module);
import { mongo, Long } from '../helper/mongo';
import { singleton as kraken, Asset } from '../kraken';
import { Dataset } from './dataset';

declare interface MongoBracket {
	avg: number,
	first: number,
	last: number,
	min: number,
	max: number,
	volume: Array<number>
}

const groupedAssetAverage : { [currency: string]: { [x: string] : string } } = {};
const projectToArray = {};
assets.tradableNames.forEach (name => {
	var proj = {
		volume: [
			'$' + name + '_volumefirst',
			'$'  + name + '_volumelast'
		]
	};
	[
		'avg',
		'first',
		'last',
		'min',
		'max'
	].forEach (operation => {
		var opObj = {};
		opObj['$' + operation] = '$assets.' + name + '.last';
		groupedAssetAverage[name + '_' + operation] = opObj;
		proj[operation] = '$' + name + '_' + operation;
	});
	groupedAssetAverage[name + '_volumefirst'] = { $first: '$assets.' + name + '.today.volume' };
	groupedAssetAverage[name + '_volumelast']  = { $last:  '$assets.' + name + '.today.volume' };
	projectToArray[name] = proj;
});
// console.log ('var groupedAssetAverage = ' + JSON.stringify (groupedAssetAverage) + ';\nvar projectToArray = ' + JSON.stringify (projectToArray) + ';\n');


function cleanupAndCallback (data : Array<{ timestamp: number, assets: { [currency: string]: MongoBracket } }>, callback: (err: Error, data: { [currency:string]: Dataset})=>void) {
	var first = -1;
	for (var i = 0; i < data.length; i++) {
		if (data[i] !== null) {
			if (first < 0) {
				first = i;
				break;
			}
		}
	}
	if (first < 0) {
		callback (Error ('no data found'), null);
	} else {

		// prevent first element from being NULL
		if (data[0] === null) data[0] = data[first];

		// prevent NaN from occurring in first element
		for (var k in data[0].assets) {
			for (var l in data[0].assets[k]) {
				if (isNaN (data[0].assets[k][l])) {
					for (var i = 1; i < data.length; i++) {
						data[0].assets[k][l] = 0;
						if (!isNaN (data[i].assets[k][l])) {
							data[0].assets[k][l] = data[i].assets[k][l];
							break;
						}
					}
				}
			}
		}

		// check all following elements
		for (var i = 1; i < data.length; i++) {
			// if NULL copy the one before
			if (data[i] === null) {
				data[i] = data[i - 1];
			}
			// if NaN copy value of the one before
			for (var k in data[i].assets) {
				for (var l in data[i].assets[k]) {
					if (isNaN (data[i].assets[k][l])) {
						data[i].assets[k][l] = data[i - 1].assets[k][l];
					}
				}
			}
		}
	}
	var sets: { [currency:string]: Dataset} = {};
	for (var k in data[0].assets) {
		var arr: Array<MongoBracket> = [];
		for (var i = 0; i < data.length; i++) {
			arr.push (data[i].assets[k]);
		}
		sets[k] = Dataset.fromArray (arr);
	}
	callback (null, sets);
}


function getAggregatedData (secondsPerBracket : number, bracketCount : number, callback : (err: Error, result: { [currency:string]: Dataset}) => void) {
	mongo (db => {
		var ticker = db.collection ('ticker');
		var now = kraken.serverTime ();

		var msPerBracket = secondsPerBracket * 1000;
		var startT = now - (msPerBracket * bracketCount);
		var brackets : Array<{ timestamp: number, assets: { [currency: string]: number } }> = [];
		for (var i = 0; i < bracketCount; i++) brackets.push (null);
		var remaining = bracketCount;

		ticker.aggregate ([
			{
				$match: {
					timestamp: {
						$gt: Long.fromNumber (startT),
						$lt: Long.fromNumber (now)
					}
				}
			}, {
				$project: {
					bracket: {
						$floor: {
							$divide: [
								{
									$add: [
										"$timestamp",
										Long.fromNumber (-startT)
									]
								},
								Long.fromNumber (msPerBracket)
							]
						}
					},
					assets: 1
				}
			}, {
				$group: Object.assign ({
					_id: "$bracket",
				}, groupedAssetAverage)
			}, {
				$project: projectToArray
			}
		]).toArray ((err, result) => {
			if (err) callback (err, null);
			result.sort ((a, b) => {
				return a._id - b._id;
			});
			var data: Array<{ timestamp: number, assets: { [currency: string]: MongoBracket } }> = [], lastBracket = -1;
			result.forEach ((item, i) => {
				var assets = {};
				for (var k in item) {
					if (k !== '_id') assets[k] = item[k];
				}
				while (++lastBracket < item._id) {
					data.push (null);
				}
				data.push ({
					timestamp: startT + i * msPerBracket,
					assets: assets
				});
			});
			cleanupAndCallback (data, callback);
		});
	});
}


function unfoldData (data: Array<{ timestamp: number, assets: { [currency: string]: number } }>): { [currency: string]: Dataset } {
	var ret : { [currency: string]: Array<number> } = {};
	for (var k in data[0].assets) {
		var item : Array<number> = [];
		for (var i = 0; i < data.length; i++) {
			item.push (data[i].assets[k]);
		}
		ret[k] = item;
	}
	var retObj: { [currency:string]: Dataset } = {};
	for (var k in ret) {
		retObj[k] = Dataset.fromArray (ret[k]);
	}
	return retObj;
}

export { getAggregatedData, unfoldData };
export default getAggregatedData;
