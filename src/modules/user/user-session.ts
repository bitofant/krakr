import { User, getUser } from './user';
import bus from '../event-bus';
import assets from '../assets';
import { singleton as kraken } from '../kraken';

import logger from '../helper/logger';
import { hints } from '../trading-hints/hints';
const log = logger(module);

/**
 * 
 * @param {SocketIO.Socket} socket 
 * @param {*} auth
 */
class UserSession {
	public user : User;

	constructor (socket, auth) {

		var user = this.user = getUser (auth);
		this.user.sockets.add (socket);


		socket.on ('balance', () => {
			socket.emit ('balance', {
				balance: user.balance,
				moneySpent: user.getMoneySpent (),
				avgBuyPrice: user.getAvgBuyPrice (),
				totalDeposit: user.getMoneyDeposited (),
				hints: hints
			});
			setTimeout (sendTradableAssetValues, 500);
		});
		socket.on ('balance:refresh', () => {
			user.refreshBalance (() => {
				socket.emit ('moneySpent', user.getAvgBuyPrice ());
			});
		});


		socket.on ('currency-settings:get', (assetID: string) => {
			log ('peng: puff!', 'red');
			socket.emit ('currency-settings', {
				id: assetID,
				peng: 'puff!'
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

}



export default UserSession;
