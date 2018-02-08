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




const buyStrategy : Array<{
	objectionToBuy: (currency: string, dataset: Dataset) => string
}> = [
	{
		// mid stochastic < 50%
		objectionToBuy (currency, dataset) {
			var midStoch = fn.stochastic.mid (dataset).d;
			if (midStoch.getClose () < .5) return null;
			var pct = Math.round (midStoch.getClose () * 100);
			return 'mid stochastic suggests it\'s strongly overbought (' + pct + '%)';
		}
	},
	{
		// fast MACD trigger crossed signal
		objectionToBuy (currency, dataset) {
			var value = fn.macd.fast (dataset).hist.getClose ();
			if (value >= 0) return null;
			return 'fast MACD is on a decline (' + value.toString ().substr (0, props.hints.numberOfMacdDigitsToPrint + 1) + ')';
		}
	},
	{
		// mid MACD trigger crossed signal
		objectionToBuy (currency, dataset) {
			var value = fn.macd.mid (dataset).hist.getClose ();
			if (value >= 0) return null;
			return 'mid MACD is on a decline (' + value.toString ().substr (0, props.hints.numberOfMacdDigitsToPrint + 1) + ')';
		}
	},
	{
		// mid MACD-Line positive
		objectionToBuy (currency, dataset) {
			if (props.hints.requireMACDtoBePositive === false) return null;
			var value = fn.macd.mid (dataset).macd.getClose ();
			if (value >= 0) return null;
			return 'mid MACD-Line should be above 0 (is at ' + value.toString ().substr (0, props.hints.numberOfMacdDigitsToPrint + 1) + ')';
		}
	},
	{
		// slow MACD trigger crossed signal
		objectionToBuy (currency, dataset) {
			var value = fn.macd.slow (dataset).hist.getClose ();
			if (value >= 0.01) return null;
			return 'slow MACD is on a decline (' + value.toString ().substr (0, props.hints.numberOfMacdDigitsToPrint + 1) + ')';
		}
	},
	{
		// mid stochastic comes from below 30%
		objectionToBuy (currency, dataset) {
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
	objectionToSell: (currency: string, dataset: Dataset) => string
}> = [
	{
		// mid stochastic dropped below 80%
		objectionToSell (currency, dataset) {
			var value = fn.stochastic.mid (dataset).d.getClose ();
			if (value < .8) return null;
			var pct = Math.round (value * 100);
			return 'mid stochastic still looks good (' + pct + '%)';
		}
	}, 
	{
		// slow MACD went negative
		objectionToSell (currency, dataset) {
			var value = fn.macd.slow (dataset).hist.getClose ();
			if (value < -0.01) return null;
			return 'slow MACD still looks promising (' + value.toString ().substr (0, props.hints.numberOfMacdDigitsToPrint) + ')';
		}
	}
];



var didBuy: { [currency:string]: boolean } = {
	// BCH: true,
	// XETH: true,
	// DASH: true,
	// XREP: true,
	// XXBT: true,
	// XXMR: true,
	// XXRP: true
};

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
			getAggregatedData (props.hints.buyAndSellPeriodInMinutes * 60, 120, (err, result) => {
				if (err) throw err;
				var t2 = Date.now ();
				for (var k in result) { // for each currency "k"...
					var dataset = result[k];
					if (!(didBuy[k] || false)) {

						// I don't yet own this currency. should I buy?
						let reason: string = null;
						buyStrategy.forEach ((strategy, i) => {
							if (reason !== null) return;
							reason = strategy.objectionToBuy (k, dataset);
							if (reason !== null) reason = i + '|' + k + (k.length < 4 ? ' ' : '') + ' is not a buy: ' + reason;
						});
						if (reason === null) {
							log ('+|' + k + (k.length < 4 ? ' ' : '') + ' is a buy!!!!!!!!!! (' + values[k].last + '€)', 'red');
							didBuy[k] = true;
							bus.emit ('buy', k);
						} else {
							log (reason);
						}

					} else {

						// I do own this currency. should I sell?
						let reason: string = null;
						sellStrategy.forEach ((strategy, i) => {
							if (reason !== null) return;
							reason = strategy.objectionToSell (k, dataset);
							if (reason !== null) reason = '*|' + k + (k.length < 4 ? ' ' : '') + ' hodl (' + values[k].last + '€): ' + reason;
						});
						if (reason === null) {
							log ('-|' + k + (k.length < 4 ? ' ' : '') + ' sell as fast as possible!!! (' + values[k].last + '€)', 'red');
							didBuy[k] = false;
							bus.emit ('sell', k);
						} else {
							log (reason);
						}

					}
				}
				log ('mongoDB-aggregation took ' + (t2 - t1) + 'ms, financial calculations ' + (Date.now () - t2) + 'ms');
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

const hints = {
	a: 'b'
};

export default hints;
