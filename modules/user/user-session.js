const getUser = require ('./user');
const bus = require ('../event-bus');
const assets = require ('../assets');
const kraken = require ('../kraken').singleton;

const log = require ('../helper/logger') (module);

/**
 * 
 * @param {SocketIO.Socket} socket 
 * @param {*} auth
 */
function UserSession (socket, auth) {

	var user = getUser (auth);
	user.sockets.add (socket);


	socket.on ('balance', () => {
		socket.emit ('balance', {
			balance: user.balance,
			moneySpent: user.getMoneySpent (),
			avgBuyPrice: user.getAvgBuyPrice (),
			totalDeposit: user.getMoneyDeposited ()
		});
		setTimeout (sendTradableAssetValues, 500);
	});
	socket.on ('balance:refresh', () => {
		user.refreshBalance (() => {
			socket.emit ('moneySpent', getAvgBuyPrice ());
		});
	});


	var sendTradableAssetValues = () => {
		socket.emit ('values_of_tradable_assets', kraken.getValueOfTradables ());
	};
	(function () {
		var trad = kraken.getValueOfTradables ();
		if (trad.BCH) socket.emit ('values_of_tradable_assets', trad);
	}) ();
	
	bus.on ('values_of_tradable_assets', sendTradableAssetValues);

	socket.on ('disconnect', () => {
		bus.removeListener('values_of_tradable_assets', sendTradableAssetValues);
	});

}



module.exports = UserSession;
