const assets = require ('../modules/assets');
const kraken = require ('../modules/kraken').singleton;

kraken.callAPI ('AssetPairs', null, (err, result) => {
	if (err) throw err;


	assets.names.forEach (asset => {
		for (var pair in result) {
			var p = result[pair];
			if (p.base === asset) {
				if (p.quote === 'ZEUR') {
					if (assets[asset].pair !== pair) throw Error ('Wrong pair for ' + assets[asset].name);
					return;
				}
			}
		}
		if (assets[asset].pair) throw Error (assets[asset].name + ' should not have a pair!');
	});

	console.log ('All tests passed;');

}, 5);
