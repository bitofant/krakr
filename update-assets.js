const fs = require ('fs');
const https = require ('https');

const tags = {
	begin: '//BEGIN_CURRENCY_SECTION',
	end: '//END_CURRENCY_SECTION'
};

function updateKrakenAssets (callback) {

}

function updateCryptowatchAssets (assets, callback) {
	https.request ('https://api.cryptowat.ch/assets', req => {
		var chunks = [];
		req.on ('data', chunk => {
			chunks.push (chunk);
		});
		req.on ('end', () => {
			var cwAssets = JSON.parse (Buffer.concat (chunks).toString ('utf8')).result;
			for (var k in assets) {
				var item = assets[k];
				if (k.charAt (0) === 'Z') {
					item.cryptowatch = { symbol: '', route: '' };
					continue;
				}
				var search = item.altname.toLowerCase ();
				var found = false;

				switch (k) {
					case 'XXBT': search = 'btc'; break;
					case 'XXDG': search = 'doge'; break;
				}
				
				cwAssets.forEach (cwa => {
					if (found) return;
					if (cwa.symbol === search) {
						found = true;
						if (k !== 'XZEC') item.name = cwa.name;
						item.cryptowatch = {
							symbol: cwa.symbol,
							route: cwa.route
						};
					}
				});
				if (!found && !item.cryptowatch) item.cryptowatch = { symbol: '', route: '' };
			}
			callback ();
		});
	}).end ();
}

fs.readFile (__dirname + '/modules/assets.js', 'utf8', (err, data) => {
	if (err ) throw err;
	var p1 = data.indexOf (tags.begin);
	var p2 = data.indexOf (tags.end);
	if (p1 < 0 || p2 < 0) throw Error ('tags not found');
	p1 += tags.begin.length + 1;
	var parts = [
		data.substr (0, p1),
		data.substr (p1, p2 - p1),
		data.substr (p2)
	];
	var curr = JSON.parse ('{' + parts[1] + '}');

	updateCryptowatchAssets (curr, () => {
		var sc = JSON.stringify (curr, null, '	');
		sc = sc.substr (2, sc.length - 3) + '	';
		parts[1] = sc;
		var joined = parts.join ('');
		fs.writeFile (__dirname + '/modules/assets.js', joined, err => {
			if (err) throw err;
			joined = joined.split ('module.exports = ').join ('export default ');
			fs.writeFile (__dirname + '/htdocs/js/assets.js', joined, err => {
				if (err) throw err;
				console.log ('file written;');
			});
		});
	});
});
