const https = require ('https');
const log = require ('../helper/logger') (module);

/**
 * 
 * @param {string} url 
 * @returns {(symbol:string,callback:(err,data)=>void)=>void}
 */
function createRequester (url) {
	var urlS = url.split (':symbol:');
	return (symbol, callback) => {
		if (typeof (symbol) !== 'string') {
			if (symbol.cryptowatch.symbol) symbol = symbol.cryptowatch.symbol;
		}
		console.log (urlS.join (symbol));
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
				callback (err);
			});
		}).end ();
	};
}

module.exports = {
	price: createRequester ('https://api.cryptowat.ch/markets/kraken/:symbol:eur/price')
};