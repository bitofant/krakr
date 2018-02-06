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
		if (data[0] === null) data[0] = data[first];
		for (var i = 1; i < data.length; i++) {
			if (data[i] === null) {
				data[i] = data[i - 1];
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
						$gt: Long.fromNumber (startT)
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

		/*
		for (var i = 0; i < bracketCount; i++) {
			(function (i) {
				ticker.aggregate ([{
					$match: {
						timestamp: {
							$gt:  Long.fromNumber (startT +  i      * msPerBracket),
							$lte: Long.fromNumber (startT + (i + 1) * msPerBracket)
						}
					}
				}, {
					$group: Object.assign ({
						_id: Long.fromNumber (startT + (i+1) * msPerBracket)
					}, groupedAssetAverage)
				}]).toArray ((err, result) => {
					if (err) callback (err, null);
					if (result.length > 0) {
						var assets = {};
						for (var k in result[0]) {
							if (k !== '_id') assets[k] = result[0][k];
						}
						brackets[i] = {
							timestamp: result[0]._id,
							assets: assets
						};
					} else {
						//throw Error ('no data for bracket D:');
					}
					if (--remaining <= 0) cleanupAndCallback (brackets, callback);
				});
			}) (i);
		}
		*/
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
