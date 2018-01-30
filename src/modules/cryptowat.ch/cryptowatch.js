const bus = require ('../event-bus')
const assets = require ('../assets');
const request = require ('./cw-request');
const log = require ('../helper/logger') (module);

function CryptoWatch () {

	function updateAll (callback) {
		var assetValues = {}, i = 0;
		function next () {
			var assetName = assets.tradableNames[i++];
			var asset = assets[assetName];
			request.price (asset, (err, result) => {
				if (err) {
					log (err);
				} else {
					assetValues[assetName] = result.price;
					bus.emit ('currency:' + assetName, result.price);
				}
				if (i >= assets.tradableNames.length) {
					if (callback) callback (assetValues);
				} else {
					setTimeout (next, 200);
				}
			});
		}
		next ();
	}
	this.updateAll = updateAll;

	// var t1 = Date.now ();
	// updateAll (assets => {
	// 	log (JSON.stringify (assets, null, 4));
	// });

}
const singleton = new CryptoWatch ();


/*
// WORK IN PROGRESS

bus.on ('values_of_tradable_assets', data => {
	singleton.updateAll (assetValues => {
		for (var k in assetValues) {
			if (data[k]) console.log (k + ': ' + (k.length < 4 ? ' ' : '') + (assetValues[k] - data[k].last));
		}
	})
})
*/

module.exports = singleton;
