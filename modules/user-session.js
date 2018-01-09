const Kraken = require ('./kraken');
const UserStore = require ('./user-store');
const bus = require ('./event-bus');
const assets = require ('./assets');

/**
 * 
 * @param {SocketIO.Socket} socket 
 * @param {*} auth
 */
function UserSession (socket, auth) {
	var store = this.store = new UserStore (auth);
	var kraken = new Kraken (auth);

	var balance = store.get ('balance', {
		ZEUR: 0
	}), ledgers = store.get ('ledgers', []);


	function fetchBalance (callback) {
		kraken.callAPI ('Balance', null, (err, result) => {
			if (err) throw err;
			for (var k in result) {
				balance[k] = parseFloat (result[k]);
			}
			store.set ('balance', balance);
			socket.emit ('balance', balance);
			if (callback) callback ();
		}, 10);
	}

	function reformatLedger (id, ledger) {
		return Object.assign (ledger, {
			id:      id,
			amount:  parseFloat (ledger.amount),
			fee:     parseFloat (ledger.fee),
			balance: parseFloat (ledger.balance)
		});
	}

	function fullLedgerImport (callback) {
		function next () {
			var search = ledgers.length > 0 ? {
				end: ledgers[0].time
			} : null;
			kraken.callAPI ('Ledgers', search, (err, result) => {
				var count = 0;
				for (var k in result.ledger) {
					count++;
					var found = false;
					ledgers.forEach (l => {
						if (found) return;
						if (l.id === k) found = true;
					})
					if (found) {
						console.log ('duplicate prevented');
						continue;
					}
					ledgers.push (reformatLedger (k, result.ledger[k]));
				}
				ledgers.sort ((a, b) => {
					return a.time - b.time;
				});
				if (count < 50) {
					if (callback) callback ();
				} else {
					setTimeout (next, 3000);
				}
			}, 15);
		}
		next ();
	}
	function updateLedgers (callback) {
		if (ledgers.length === 0) {
			fullLedgerImport (() => {
				store.set ('ledgers', ledgers);
				if (callback) callback ();
			});
		} else {
			function next () {
				kraken.callAPI ('Ledgers', {
					start: ledgers[ledgers.length - 1].time
				}, (err, result) => {
					var count = 0;
					for (var k in result.ledger) {
						count++;
						var found = false;
						ledgers.forEach (l => {
							if (found) return;
							if (l.id === k) found = true;
						})
						if (found) {
							console.log ('duplicate prevented');
							continue;
						}
						ledgers.push (reformatLedger (k, result.ledger[k]));
					}
					ledgers.sort ((a, b) => {
						return a.time - b.time;
					});
					if (count < 50) {
						store.set ('ledgers', ledgers);
						if (callback) callback ();
					} else {
						setTimeout (next, 3000);
					}
				}, 15);
			}
			next ();
		}
	}
	function getAvgBuyPrice () {
		var details = {
			BCH: 0
		};
		var i = 0;
		while (i < ledgers.length - 1) {
			var trade1 = ledgers[i++];
			if (trade1.type === 'trade') {
				var trade2 = ledgers[i++];
				if (trade1.asset === 'ZEUR') {
					var tmp = trade2;
					trade2 = trade1;
					trade1 = tmp;
				}
				var asset = trade1.asset;
				var price = trade2.amount;
				if (!details[asset]) details[asset] = 0;
				details[asset] -= price;
				if (trade1.balance === 0) details[asset] = 0;
			}
		}
		return details;
	}
	socket.on ('balance', () => {
		socket.emit ('balance', balance);
		socket.emit ('moneySpent', getAvgBuyPrice ());
		setTimeout (sendTradableAssetValues, 500);
	});
	socket.on ('balance:refresh', () => {
		fetchBalance (() => {
			updateLedgers (() => {
				socket.emit ('moneySpent', getAvgBuyPrice ());
			});
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
		kraken.socketClosed ();
		store.socketClosed();
		bus.removeListener('values_of_tradable_assets', sendTradableAssetValues);
	})

}

module.exports = UserSession;
