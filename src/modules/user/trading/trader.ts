import { User } from "../user";
import bus from '../../event-bus';
import { Orderer } from "./orderer";
import logger from '../../helper/logger';
import { singleton as kraken } from "../../kraken";
import assets, { getAsset } from '../../assets';
import { Order } from "./order";
const log = logger (module);

class Trader {
	private user : User;
	private orderer : Orderer;

	private owned: { asset:string, amount:number, price:number, waiting:number, order:Order, lastOrder:Order };

	constructor (user: User) {
		this.user = user;
		this.orderer = new Orderer (user);
		this.owned = {
			asset: 'BCH',
			amount: .14,
			price: 1500,
			waiting: 0,
			order: new Order (user, 'asdf', 'BCH', 1500, .14),
			lastOrder: null
		};

		var self = this;
		bus.on ('buy', currency => {
			self.bus_buy (currency);
		});
		bus.on ('sell',currency => {
			self.bus_sell (currency);
		});
		user.bus.on ('balance', changes => {
			self.user_balance (changes);
		});
		user.bus.on ('sold', (gain?:number) => {
			log ('sold with a ' + (gain ? gain : '???') + '€ gain!');
		});
	}


	bus_buy (currency) {
		if (this.owned.amount > .001 || this.owned.waiting > .001) {
			return;
		}
		var euros = this.user.balance.ZEUR - 1;
		if (euros > 100) euros = 100;
		else if (euros < 10) {
			log ('would like to buy but insufficient funding :-|');
			return;
		}
		var values = kraken.getValueOfTradables ();
		var cprice = values[currency].bid * 1.00005;
		var asset = getAsset (currency);
		// var factor = Math.pow (10, asset.decimals);
		// cprice = Math.round (cprice * factor) / factor;
		this.owned.waiting = euros / cprice;
		this.owned.price = cprice;
		this.owned.amount = 0;
		log ('buying ' + currency + ' for ' + euros + '€');
		this.orderer.placeOrder ('buy', currency, euros / cprice, cprice, (err, order) => {
			if (err) log (err.stack);
			log ('buy complete; order id: ' + (order ? order.id : '(unknown id)'));
			this.owned.lastOrder = this.owned.order;
			this.owned.order = order;
		});
	}

	bus_sell (currency) {
		if (this.owned.amount + this.owned.waiting > .001) {
			if (this.owned.waiting > .001) {
				var tmpWaiting = this.owned.waiting;
				if (this.owned.order !== null) {
					this.owned.order.cancel ((err, success) => {
						if (err) throw err;
						log (success ? 'order canceled successfully' : 'order could not be canceled');
					});
				} else {
					this.orderer.cancelOrder ('buy', this.owned.asset, this.owned.waiting, success => {
						log ('buy cancelled ' + (success ? '' : 'non-') + 'successfully');
						if (success) {
							this.owned.waiting -= tmpWaiting;
						}
					});
				}
			}
			this.owned.waiting -= this.owned.amount;
			var values = kraken.getValueOfTradables();
			var cprice = values[currency].ask / 1.00005;
			this.orderer.placeOrder ('sell', this.owned.asset, this.owned.amount, cprice, (err, order) => {
				log ('sell complete; order-id: ' + (order ? order.id : '(no id found)'));
				this.owned.lastOrder = this.owned.order;
				this.owned.order = order;
			});
		}
	}


	user_balance (changes:Array<{ asset:string, oldValue:number, newValue:number }>) {
		changes.forEach (change => {
			if (change.asset === this.owned.asset) {
				var delta = change.newValue - change.oldValue;
				this.owned.waiting -= delta;
				this.owned.amount += delta;
				if (Math.abs (this.owned.waiting) < .001) {
					if (this.owned.amount < .001) {
						if (this.owned.order && this.owned.lastOrder) {
							var buyPrice = this.owned.lastOrder.price;
							var sellPrice = this.owned.order.price;
							var amount = this.owned.order.amount;
							var gain = (Math.round ((sellPrice - buyPrice) * amount * 100) / 100);
							this.user.bus.emit ('sold', gain);
						} else {
							this.user.bus.emit ('sold');
						}
					} else {
						this.user.bus.emit ('bought');
					}
				}
			}
		});
	}

	


}
export { Trader };
export default Trader;
