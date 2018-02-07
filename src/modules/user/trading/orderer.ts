import { User } from "../user";
import { getAsset } from "../../assets";
import { singleton as kraken } from '../../kraken';
import { Order } from "./order";
import logger from '../../helper/logger';
import props from '../../../application-properties';
const log = logger (module);


declare interface OpenOrder {
	"refid": any,
	"userref": number,
	"status": "open"|"closed"|"pending"|"canceled"|"expired",
	"opentm": number,
	"starttm": number,
	"expiretm": number,
	"descr": {
		"pair": string,
		"type": "sell"|"buy",
		"ordertype": "limit"|"market",
		"price": string,
		"price2": string,
		"leverage": "none",
		"order": string,
		"close": string
	},
	"vol": string, //"0.14000000",
	"vol_exec": string, //"0.00000000",
	"cost": string,
	"fee": string,
	"price": string,
	"stopprice": string,
	"limitprice": string,
	"misc": string,
	"oflags": ""|"fciq"
}


class Orderer {
	private user:User;
	constructor (user:User) {
		this.user = user;
	}

	cancelOrder (type: "buy"|"sell", currency: string, amount: number, callback: (err:Error,success:boolean)=>void) {
		this.user.kraken.callAPI ('OpenOrders', null, (err, result) => {
			if (err) throw err;
			var asset = getAsset (currency);
			var openOrders: { [txid:string]:OpenOrder } = result.open;
			for (var orderID in openOrders) {
				var ord = openOrders[orderID];
				if (ord.descr.pair !== asset.pair) continue;
				if (ord.descr.type !== type) continue;
				if (Math.abs (parseFloat (ord.vol) + parseFloat (ord.vol_exec) - amount) > .001) continue;
				log ('order found, id: ' + orderID);
				var o = new Order (this.user, orderID, currency);
				o.cancel (callback);
				return;
			}
			callback (new Error ('order not found'), false);
		}, 5);
	}

	placeOrder (type: "buy"|"sell", currency: string, amount: number, price: number, callback: (err: Error, order: Order)=>void) {
		// asset details
		var asset = getAsset (currency);
		//if (asset !== null) return callback (null, null);

		if (props.makeBuyAndSellPricesUnrealistic) {
			if (type === 'sell') price = price * 2;
			if (type === 'buy') price = price / 2;
		}

		// round number to decimals for currency
		var factor = Math.pow (10, asset.price_decimals);
		price = Math.round (price * factor) / factor;
		amount = (amount * 10000 | 0) / 10000;

		this.user.kraken.callAPI ('AddOrder', {
			pair: asset.pair,
			type: type,
			ordertype: 'limit',
			price: price,
			volume: amount,
			oflags: 'fciq',
			expiretm: '+' + (5 * 60)
		}, (err, result) => {
			if (err) callback (err, null);
			else callback (null, new Order (this.user, result.txid[0], currency, price, amount));
		}, 1);
		console.log (type + ' ORDER ' + amount + ' x ' + asset.pair + ' @ ' + price + '€/' + asset.symbol);
	}

}

export { Orderer };
export default Orderer;
