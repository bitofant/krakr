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

module.exports = updateLedgers;