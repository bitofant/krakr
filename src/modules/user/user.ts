import Kraken from '../kraken';
import UserStore from './user-store';
import bus from '../event-bus';
import assets from '../assets';
import logger from '../helper/logger';
const log = logger (module);
import SocketCollection from './socket-collection';
import { updateLedgers as getLedger, getTrades } from './ledger';
import { EventEmitter } from 'events';
import { Trader } from './trading/trader';


/** @type {Object.<string,User>} */
var users = {};


/**
 * @class
 * @param {{apikey:string,privkey:string}} auth
 * @member {string} name
 */
class User {
	private store : UserStore;
	public kraken : Kraken;
	public sockets : SocketCollection;
	private username : string;
	private useremail : string;
	public balance : { [assetName: string]: number };
	private ledger;
	public bus: EventEmitter = new EventEmitter ();
	private trader: Trader;

	constructor (auth) {
		var self = this;
		log ('New user created');
		var store = this.store = new UserStore (auth);
		var kraken = this.kraken = new Kraken (auth);
		var sockets = this.sockets = new SocketCollection ();

		this.username = store.get ('name', '');
		var email = store.get ('email', '');

		var balance = this.balance = store.get ('balance', {
			ZEUR: 0
		});
		this.ledger = store.get ('ledger', []);

		if (this.username === 'Joeranss') {
			this.trader = new Trader (this);
		}
	}

	/**
	 * @param {string=} newName 
	 * @returns {string}
	 */
	name (newName) {
		if (newName) this.store.set ('name', this.username = newName);
		return this.username;
	};

	/**
	 * @param {string=} newEmail 
	 * @returns {string}
	 */
	email (newEmail) {
		if (newEmail) this.store.set('email', this.useremail = newEmail);
		return this.useremail;
	};


	/**
	 * 
	 * @param {()=>void} callback 
	 */
	fetchBalance (callback) {
		this.kraken.callAPI ('Balance', null, (err, result) => {
			if (err) throw err;
			var changed: Array<{ asset:string, oldValue:number, newValue:number}> = [];
			for (var k in result) {
				var newValue = parseFloat (result[k]);
				if (newValue !== this.balance[k]) {
					changed.push ({
						asset: k,
						oldValue: this.balance[k],
						newValue: newValue
					});
				}
				this.balance[k] = newValue;
			}
			this.store.set ('balance', this.balance);
			this.sockets.emit ('balance', {
				balance: this.balance,
				moneySpent: this.getMoneySpent (),
				avgBuyPrice: this.getAvgBuyPrice (),
				totalDeposit: this.getMoneyDeposited ()
			});
			if (changed.length > 0) {
				changed.forEach (change => {
					this.bus.emit ('balance:' + change.asset, change);
				});
				this.bus.emit ('balance', changed);
			}
			if (callback) callback ();
		}, 10);
	}

		
	/**
	 * 
	 * @param {()=>void} callback 
	 */
	updateLedger (callback) {
		log ('updateLedger();');
		getLedger (this.kraken, this.ledger, changesFound => {
			if (changesFound) {
				log ('changes found!');
			} else {
				log ('no changes found');
			}
			this.store.set ('ledger', this.ledger);
			if (callback) callback ();
		});
	}


	/**
	 * @returns {Object.<string,number>}
	 */
	getMoneySpent () {
		var details = {
			BCH: 0
		};
		getTrades (this.ledger).forEach (trade => {
			var asset = trade.asset,
					price = trade.price;
			if (!details[asset]) details[asset] = 0;
			details[asset] += price;
			// if (trade1.balance === 0) details[asset] = 0;
		});
		return details;
	}


	/**
	 * @returns {Object.<string,number>}
	 */
	getAvgBuyPrice () {
		var remaining = Object.assign ({}, this.balance);
		var details = {};
		var i = this.ledger.length - 1;
		getTrades (this.ledger).reverse ().forEach (trade => {
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
		for (var k in this.balance) {
			details[k] /= this.balance[k];
		}
		return details;
	}


	/**
	 * @returns {number}
	 */
	getMoneyDeposited () {
		var eur = 0;
		for (var i = 0; i < this.ledger.length; i++) {
			var deposit = this.ledger[i];
			if (deposit.type === 'deposit' && deposit.asset === 'ZEUR') {
				eur += deposit.amount;
			}
		}
		return eur;
	}


	/**
	 * 
	 * @param {()=>void} callback 
	 */
	refreshBalance = callback => {
		this.fetchBalance (() => {
			this.updateLedger (() => {
				if (callback) callback ();
			});
		});
	};

	_getFromStore (varname, defaultValue) {
		return this.store.get (varname, defaultValue);
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

function getUserByName (name) {
	if (name.length === 0) return null;
	for (var k in users) {
		if (users[k].name ().toLowerCase () === name) {
			return users[k]._getFromStore ('auth', null);
		}
	}
	return null;
};

export { User, getUser, getUserByName };
export default getUser;
