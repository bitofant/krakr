import assets from '../assets';
import bus from '../event-bus';
import Logger from '../helper/logger';
const log = Logger (module);
import props from '../../application-properties';
import fs = require ('fs'); 
import { singleton as kraken, Asset } from '../kraken';
import { mongo, Long } from '../helper/mongo';

var lastEntry: { timestamp: number, assets: { [currency: string]: Asset } } = null;

if (props.krakenHistoryWrites) {
	mongo (db => {
		var hist = db.collection ('ticker');
		bus.on('values_of_tradable_assets', (values : {[currency: string]: Asset}) => {
			var now = kraken.serverTime ();
			// if (lastEntry !== null) {
			// 	log ('Time since last entry: ' + (Math.round ((lastEntry.timestamp - now) / 100) / 10) + 's');
			// }
			lastEntry = {
				timestamp: now,
				assets: values
			};
			hist.insertOne ({
				timestamp: Long.fromNumber (now),
				assets: values
			}, (err, result) => {
				if (err) throw err;
			});
		});
	});
}

function find () {

}


export default {
	'a': 'B',
	find
};
