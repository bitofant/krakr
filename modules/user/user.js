const Kraken = require ('../kraken');
const UserStore = require ('./user-store');
const bus = require ('../event-bus');
const assets = require ('../assets');
const log = require ('../helper/logger') (module);
const SocketCollection = require ('./socket-collection');
const getLedger = require ('./ledger');


/** @type {Object.<string,User>} */
var users = {};

/**
 * @class
 * @param {{apikey:string,privkey:string}} auth
 * @member {string} name
 */
function User (auth) {
	var self = this;
	log ('New user created');
	var store = new UserStore (auth);
	var kraken = new Kraken (auth);
	var sockets = this.sockets = new SocketCollection ();

	var name = store.get ('name', '');
	/**
	 * @param {string=} newName 
	 * @returns {string}
	 */
	this.name = newName => {
		if (newName) store.set ('name', name = newName);
		return name;
	};

	var email = store.get ('email', '');
	/**
	 * @param {string=} newEmail 
	 * @returns {string}
	 */
	this.email = newEmail => {
		if (newEmail) store.set('email', email = newEmail);
		return email;
	};


	var balance = this.balance = store.get ('balance', {
		ZEUR: 0
	}), ledger = store.get ('ledger', []);


	function fetchBalance (callback) {
		kraken.callAPI ('Balance', null, (err, result) => {
			if (err) throw err;
			for (var k in result) {
				balance[k] = parseFloat (result[k]);
			}
			store.set ('balance', balance);
			sockets.emit ('balance', {
				balance: balance,
				moneySpent: getMoneySpent (),
				avgBuyPrice: getAvgBuyPrice (),
				totalDeposit: getMoneyDeposited ()
			});
			if (callback) callback ();
		}, 10);
	}

	function updateLedger (callback) {
		log ('updateLedger();');
		getLedger (kraken, ledger, changesFound => {
			if (changesFound) {
				log ('changed found!');
			} else {
				log ('no changes found');
			}
			store.set ('ledger', ledger);
			if (callback) callback ();
		});
	}

	function getMoneySpent () {
		var details = {
			BCH: 0
		};
		getTrades (ledger).forEach (trade => {
			var asset = trade.asset,
					price = trade.price;
			if (!details[asset]) details[asset] = 0;
			details[asset] += price;
			// if (trade1.balance === 0) details[asset] = 0;
		});
		return details;
	}
	this.getMoneySpent = getMoneySpent;

	function getAvgBuyPrice () {
		var remaining = Object.assign ({}, balance);
		var details = {};
		var i = ledger.length - 1;
		getTrades (ledger).reverse ().forEach (trade => {
			var asset = trade.asset,
					price = trade.price,
					coins = trade.coins;
			if (!details[asset]) details[asset] = 0;
			if (!remaining[asset]) remaining[asset] = 0;

			if (remaining[asset] > 0) {
				if (price > 0) {
					if (remaining[asset] < coins) {
						var pct = remaining[asset] / coins;
						coins *= pct;
						price *= pct;
					}
					details[asset] += price;
					remaining[asset] -= coins;
				}
			}
		});
		for (var k in balance) {
			details[k] /= balance[k];
		}
		return details;
	}
	this.getAvgBuyPrice = getAvgBuyPrice;

	function getMoneyDeposited () {
		var eur = 0;
		for (var i = 0; i < ledger.length; i++) {
			var deposit = ledger[i];
			if (deposit.type === 'deposit' && deposit.asset === 'ZEUR') {
				eur += deposit.amount;
			}
		}
		return eur;
	}
	this.getMoneyDeposited = getMoneyDeposited;


	this.refreshBalance = callback => {
		fetchBalance (() => {
			updateLedger (() => {
				if (callback) callback ();
			});
		});
	};

	this._getFromStore = (varname, defaultValue) => {
		return store.get (varname, defaultValue);
	};

}


/**
 * 
 * @param {{apikey:string,privkey:string}} auth 
 * @returns {User}
 */
function getUser (auth) {
	var uid = JSON.stringify (auth);
	if (!users[uid]) {
		users[uid] = new User (auth);
	}
	return users[uid];
}

getUser.byName = name => {
	if (name.length === 0) return null;
	for (var k in users) {
		if (users[k].name ().toLowerCase () === name) {
			return users[k]._getFromStore ('auth', null);
		}
	}
	return null;
};

module.exports = getUser;





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
