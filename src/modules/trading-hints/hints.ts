import assets from '../assets';
import bus from '../event-bus';
import Logger from '../helper/logger';
const log = Logger (module);
import { singleton as kraken, Asset } from '../kraken';
import { mongo, Long } from '../helper/mongo';
import { getAggregatedData, unfoldData } from './aggregated-data';
import stochastic, { fullStochastic } from './stochastic';
import macd from './macd';
import dataset, { Data, Dataset } from './dataset';
import props from '../../application-properties';
import fs = require ('fs');
import { CachedMACD, CachedStochastic } from './cached-function';

import getJsAggregatedData from './history';
import lth from './long-term-history';

const fn = {
	macd: {
		fast: CachedMACD ( 4, 16, 9),
		mid:  CachedMACD ( 6, 19, 9),
		slow: CachedMACD (12, 26, 9),
	},
	stochastic: {
		fast: CachedStochastic (14 ,4, 4),
		mid:  CachedStochastic (31 ,4, 4),
		slow: CachedStochastic (75 ,4, 4)
	}
};

var didBuy: { [currency: string]: number } = {
	// BCH: 993,
	// XETH: 644,
	// DASH: 455,
	// XREP: 41,
	// XXBT: 6640,
	// XXMR: 193,
	// XXRP: .6
};

const hints: {[currency:string]:string} = {
};




const buyStrategy : Array<{
	objectionToBuy: (currency: string, dataset: Dataset, values: { [currency: string]: Asset }) => string
}> = [
	{
		// daily fast MACD trigger crossed signal
		objectionToBuy (currency, dataset, values) {
			var value = lth.macd.fast (currency).hist.getClose ();
			if (value >= 0) return null;
			return 'daily fast MACD is on a decline (' + value.toString ().substr (0, props.hints.numberOfMacdDigitsToPrint + 1) + ')';
		}
	},
	{
		// daily fast MACD trigger crossed signal
		objectionToBuy (currency, dataset, values) {
			var value = lth.stochastic.fast (currency).d.getClose ();
			if (value < .7) return null;
			var pct = Math.round (value * 100);
			return 'daily fast stochastic suggests it\'s strongly overbought (' + pct + '%)';
		}
	},
	{
		// mid stochastic < 50%
		objectionToBuy (currency, dataset, values) {
			var midStoch = fn.stochastic.mid (dataset).d;
			if (midStoch.getClose () < .5) return null;
			var pct = Math.round (midStoch.getClose () * 100);
			return 'mid stochastic suggests it\'s strongly overbought (' + pct + '%)';
		}
	},
	{
		// fast MACD trigger crossed signal
		objectionToBuy (currency, dataset, values) {
			var value = fn.macd.fast (dataset).hist.getClose ();
			if (value >= 0) return null;
			return 'fast MACD is on a decline (' + value.toString ().substr (0, props.hints.numberOfMacdDigitsToPrint + 1) + ')';
		}
	},
	{
		// mid MACD trigger crossed signal
		objectionToBuy (currency, dataset, values) {
			var value = fn.macd.mid (dataset).hist.getClose ();
			if (value >= 0) return null;
			return 'mid MACD is on a decline (' + value.toString ().substr (0, props.hints.numberOfMacdDigitsToPrint + 1) + ')';
		}
	},
	{
		// mid MACD-Line positive
		objectionToBuy (currency, dataset, values) {
			if (props.hints.requireMACDtoBePositive === false) return null;
			var value = fn.macd.mid (dataset).macd.getClose ();
			if (value >= 0) return null;
			return 'mid MACD-Line should be above 0 (is at ' + value.toString ().substr (0, props.hints.numberOfMacdDigitsToPrint + 1) + ')';
		}
	},
	{
		// slow MACD trigger crossed signal
		objectionToBuy (currency, dataset, values) {
			var value = fn.macd.slow (dataset).hist.getClose ();
			if (value >= 0.01) return null;
			return 'slow MACD is on a decline (' + value.toString ().substr (0, props.hints.numberOfMacdDigitsToPrint + 1) + ')';
		}
	},
	{
		// mid stochastic comes from below 30%
		objectionToBuy (currency, dataset, values) {
			var wasBelow20pct = false;
			var midStoch = fn.stochastic.mid (dataset).d;
			for (var i = 0; i < props.hints.checkLastXStochasticBrackets; i++) {
				if (midStoch.data[midStoch.data.length - 1 - i].low < .3) {
					wasBelow20pct = true;
					break;
				}
			}
			if (wasBelow20pct) return null;
			var pct = Math.round (midStoch.getClose () * 100);
			return 'mid stochastic seems slightly overbought (' + pct + '%)';
		}
	},
];




const sellStrategy : Array<{
	objectionToSell: (currency: string, dataset: Dataset, values: { [currency: string]: Asset }) => string
}> = [
	{
		// mid stochastic dropped below 80%
		objectionToSell (currency, dataset, values) {
			var value = fn.stochastic.mid (dataset).d.getClose ();
			if (value < .8) return null;
			var pct = Math.round (value * 100);
			return 'mid stochastic still looks good (' + pct + '%)';
		}
	}, 
	{
		// slow MACD went negative
		objectionToSell (currency, dataset, values) {
			var value = fn.macd.slow (dataset).hist.getClose ();
			if (value < -0.01) return null;
			return 'slow MACD still looks promising (' + value.toString ().substr (0, props.hints.numberOfMacdDigitsToPrint) + ')';
		}
	},
	{
		// make sure we're profitable
		objectionToSell (currency, dataset, values) {
			var buyPrice = didBuy[currency] || 0;
			var currentPrice = values[currency].last;
			var profitFactor = 1.015;
			if (currentPrice >= buyPrice * profitFactor) return null;
			return 'we\'re negative - HODL hrad until ' + (buyPrice * profitFactor) + '€';
		}
	}
];




// setTimeout (() => {
// 	didBuy.BCH = true;
// 	bus.emit ('buy', 'BCH');
// 	setTimeout (() => {
// 		didBuy.BCH = false;
// 		bus.emit ('sell', 'BCH');
// 	}, 2000);
// }, 6000);

mongo (db => {
	var ticker = db.collection ('ticker');
	bus.on ('values_of_tradable_assets', (values : {[currency: string]: Asset}) => {
		setTimeout (() => {
			var t1 = Date.now ();
			getJsAggregatedData (props.hints.buyAndSellPeriodInMinutes * 60, 200, (err, result) => {
				if (err) throw err;
				var t2 = Date.now ();
				for (var k in result) { // for each currency "k"...
					var dataset = result[k];
					if ((didBuy[k] || 0) <= 0) {

						// I don't yet own this currency. should I buy?
						let reason: string = null;
						buyStrategy.forEach ((strategy, i) => {
							if (reason !== null) return;
							reason = strategy.objectionToBuy (k, dataset, values);
							if (reason !== null) reason = i + '|' + k + (k.length < 4 ? ' ' : '') + ' is not a buy: ' + reason;
						});
						if (reason === null) {
							var buyPrice = values[k].bid * 1.00005;
							reason = '+|' + k + (k.length < 4 ? ' ' : '') + ' is a buy!!!!!!!!!! (' + buyPrice + '€)', 'red';
							didBuy[k] = values[k].last;
							bus.emit ('buy', k);
						}
						log (reason);
						hints[k] = reason;

					} else {

						// I do own this currency. should I sell?
						let reason: string = null;
						sellStrategy.forEach ((strategy, i) => {
							if (reason !== null) return;
							reason = strategy.objectionToSell (k, dataset, values);
							if (reason !== null) {
								var changePct = Math.round ((values[k].last - didBuy[k]) / didBuy[k] * 1000) / 10;
								reason = '*|' + k + (k.length < 4 ? ' ' : '') + ' hodl (' + (changePct > 0 ? '+' : '') + changePct + '%): ' + reason;
							}
						});
						if (reason === null) {
							var sellPrice = values[k].ask / 1.00005;
							var changePct = Math.round ((sellPrice - didBuy[k]) / didBuy[k] * 1000) / 10;
							reason = '-|' + k + (k.length < 4 ? ' ' : '') + ' sell as fast as possible!!! (' + sellPrice + '€ | ' + (changePct < 0 ? '' : '+') + changePct + ')', 'red';
							didBuy[k] = 0;
							bus.emit ('sell', k);
						}
						log (reason);
						hints[k] = reason;

					}
				}
				log ('aggregation took ' + (t2 - t1) + 'ms, financial calculations ' + (Date.now () - t2) + 'ms');
				bus.emit ('hints', hints)
			});
		}, 500);
	});
});



						// var sum = (
						// 	(fn.macd.fast (dataset).hist.getClose () < 0 ? 2 : 0) +
						// 	(fn.macd.mid  (dataset).hist.getClose () < 0 ? 2 : 0) +
						// 	(fn.macd.slow (dataset).hist.getClose () < 0 ? 4 : 0) +
						// 	(fn.stochastic.mid (dataset).d.getClose () > .75 ? 1 : 0)
						// );
						// if (sum > 4) {
						// 	if (props.printBuySellStrategyHints) log ('-|' + k + (k.length < 4 ? ' ' : '') + ' sell as fast as possible!!! (' + values[k].last + '€)', 'red');
						// 	didBuy[k] = false;
						// 	bus.emit ('sell', k);
						// } else {
						// 	if (props.printBuySellStrategyHints) log ('*|' + k + (k.length < 4 ? ' ' : '') + ' hodl! (' + values[k].last + '€)');
						// }

export { hints };
export default hints;
