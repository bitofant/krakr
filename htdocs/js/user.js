import sock from '../sock';
import assets from './assets';


const user = {
	isLoggedin: false,
	totalDeposit: 1500,
	totalAssetValue: 1500,
	assets: {
		ZEUR: 0,
		BCH: {
			cid: 'BCH',
			currency: assets.BCH,
			owned: 0,
			avgBuyPrice: 0,
			moneySpent: 0,
			ask: 0,
			bid: 0,
			last: 0,
			last24h: {
				avg: 0,
				low: 0,
				high: 0,
				volume: 0,
				stoch: .19
			},
			today: {
				avg: 0,
				low: 0,
				high: 0,
				volume: 0,
				stoch: .59
			}
		}
	},
	lastUpdate: Date.now () - 10000,
	lastUpdate2: Date.now () - 10000
};
delete user.assets.BCH;

sock.on ('auth:success', () => {
	user.isLoggedin = true;
	sock.emit ('balance');
});

sock.on ('disconnect', () => {
	user.isLoggedin = false;
});

sock.on ('values_of_tradable_assets', data => {
	for (var k in data) {
		if (k === 'lastUpdate') continue;
		user.assets[k] = Object.assign (user.assets[k] || { cid: k, currency: assets[k] }, data[k]);
		assignStochastic (data[k].last, user.assets[k].last24h);
		assignStochastic (data[k].last, user.assets[k].today);
	}
	user.lastUpdate = user.lastUpdate2 = Date.now () - data.lastUpdate;
	updateTotalAssetValue ();
});

sock.on ('balance', balance => {
	user.totalDeposit = balance.totalDeposit;
	for (var k in user.assets) {
		if (k === 'ZEUR') {
			user.assets.ZEUR = balance.balance.ZEUR;
		} else {
			var asset = user.assets[k];
			asset.owned = balance.balance[k] || 0;
			asset.avgBuyPrice = balance.avgBuyPrice[k] || 0;
			asset.moneySpent = balance.moneySpent[k] || 0;
		}
	}
	updateTotalAssetValue ();
});


function updateTotalAssetValue () {
	var sum = 0;
	for (var k in user.assets) {
		var curr = user.assets[k];
		sum += k === 'ZEUR' ? curr : (curr.owned * curr.last);
	}
	return user.totalAssetValue = sum;
}


function assignStochastic (lastTrade, obj) {
	obj.stoch = Math.round ((lastTrade - obj.low) / (obj.high - obj.low) * 100);
}


export default user;
