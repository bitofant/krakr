const log = require ('../helper/logger') (module);

function reformatLedger (id, ledger) {
	return Object.assign (ledger, {
		id:      id,
		amount:  parseFloat (ledger.amount),
		fee:     parseFloat (ledger.fee),
		balance: parseFloat (ledger.balance)
	});
}

function fullLedgerImport (kraken, ledgers, callback) {
	var somethingChanged = false;
	function next () {
		var search = ledgers.length > 0 ? {
			end: ledgers[0].time
		} : null;
		kraken.callAPI ('Ledgers', search, (err, result) => {
			var count = 0;
			for (var k in result.ledger) {
				count++;
				somethingChanged = true;
				var found = false;
				ledgers.forEach (l => {
					if (found) return;
					if (l.id === k) found = true;
				})
				if (found) {
					log ('duplicate prevented');
					continue;
				}
				ledgers.push (reformatLedger (k, result.ledger[k]));
			}
			ledgers.sort ((a, b) => {
				return a.time - b.time;
			});
			if (count < 50) {
				if (callback) callback (somethingChanged);
			} else {
				setTimeout (next, 3000);
			}
		}, 15);
	}
	next ();
}

function updateLedgers (kraken, ledgers, callback) {
	if (ledgers.length === 0) {
		fullLedgerImport (kraken, ledgers, callback);
	} else {
		var somethingChanged = false;
		function next () {
			kraken.callAPI ('Ledgers', {
				start: ledgers[ledgers.length - 1].time
			}, (err, result) => {
				var count = 0;
				for (var k in result.ledger) {
					count++;
					somethingChanged = true;
					var found = false;
					ledgers.forEach (l => {
						if (found) return;
						if (l.id === k) found = true;
					})
					if (found) {
						log ('duplicate prevented');
						continue;
					}
					ledgers.push (reformatLedger (k, result.ledger[k]));
				}
				ledgers.sort ((a, b) => {
					return a.time - b.time;
				});
				if (count < 50) {
					if (callback) callback (somethingChanged);
				} else {
					setTimeout (next, 3000);
				}
			}, 15);
		}
		next ();
	}
}



/**
 * @returns {[Trade]}
 */
function getTrades (ledger) {
	var trades = [];
	var i = 0;
	while (i < ledger.length - 1) {
		var trade1 = ledger[i++];
		if (trade1.type === 'trade') {
			var trade2 = ledger[i++];
			trades.push (new Trade (trade1, trade2));
		}
	}
	return trades;
}

/**
 * 
 * @class
 * @param {{refid:string,time:number,type:"trade"|string,aclass:"currency"|string,asset:string,amount:number,fee:number,balance:number,id:string}} trade1 
 * @param {{refid:string,time:number,type:"trade"|string,aclass:"currency"|string,asset:string,amount:number,fee:number,balance:number,id:string}} trade2
 */
function Trade (trade1, trade2) {
	if (trade1.asset === 'ZEUR') {
		var tmp = trade2;
		trade2 = trade1;
		trade1 = tmp;
	}
	/** @member {string} */
	this.asset = trade1.asset;

	/** @member {number} */
	this.price = -trade2.amount;

	/** @member {number} */
	this.coins = trade1.amount;
}

updateLedgers.getTrades = getTrades;

module.exports = updateLedgers;