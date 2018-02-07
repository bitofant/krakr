import { User } from "../user";

class Order {
	private user: User;
	public id: string;
	public currency: string;
	public price: number;
	public amount: number;

	constructor (user: User, orderID: string, currency: string, price?:number, amount?:number) {
		this.user = user;
		this.id = orderID;
		this.currency = currency;
		this.price = price || 0;
		this.amount = amount || 0;
	}

	cancel (callback: (err: Error, success: boolean)=>void) {
		this.user.kraken.callAPI ('CancelOrder', { txid: this.id }, (err, result) => {
			if (err) callback (err, false);
			else callback (null, true);
		}, 5);
	}

}
export { Order };
export default Order;
