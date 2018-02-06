import assets from '../assets';
import bus from '../event-bus';
import Logger from '../helper/logger';
const log = Logger (module);
import { singleton as kraken, Asset } from '../kraken';
import { mongo, Long } from '../helper/mongo';
import { getAggregatedData, unfoldData } from './aggregated-data';
import stochastic, { fullStochastic } from './stochastic';
import macd from './macd';
import { Data, Dataset } from './dataset';
import props from '../../application-properties';


var fn = {
	macd: {
		fast: dataset => macd (dataset,  4, 16, 9),
		mid:  dataset => macd (dataset,  6, 19, 9),
		slow: dataset => macd (dataset, 12, 26, 9)
	},
	stochastic: {
		fast: dataset => fullStochastic (dataset, 14 ,4, 4),
		mid:  dataset => fullStochastic (dataset, 31 ,4, 4),
		slow: dataset => fullStochastic (dataset, 75 ,4, 4)
	}
};


var didBuy: { [currency:string]: boolean } = {};

setTimeout (() => {
	didBuy.BCH = true;
	bus.emit ('buy', 'BCH');
}, 6000);

mongo (db => {
	var ticker = db.collection ('ticker');
	bus.on ('values_of_tradable_assets', (values : {[currency: string]: Asset}) => {
		var t1 = Date.now ();
		getAggregatedData (props.buyAndSellPeriodInMinutes * 60, 120, (err, result) => {
			if (err) throw err;
			if (props.printBuySellStrategyHints) log (result.length + ' sets fetched in ' + (Date.now () - t1) + 'ms');
			if (props.printBuySellStrategyHints) log ('value<BCH>: ' + result.BCH.getClose ());
			t1 = Date.now();
			// log ('ema<BCH>: ' + result.BCH.EMA (10).getClose ());
			// log ('macd<BCH>: ' + macd (result.BCH, 6, 19, 9));
			// log ('stoch<BCH>: ' + fullStochastic (result.BCH, 75, 4, 4));
			for (var k in result) {
				var dataset = result[k];
				var midStoch = fn.stochastic.mid (dataset).d;
				var isbought: boolean = didBuy[k] || false;
				if (!isbought) {
					if (midStoch.getClose () < .5) {
							if (fn.macd.fast (dataset).hist.getClose () > 0) {
							var midMACD = fn.macd.mid (dataset);
							if (midMACD.hist.getClose () > 0) {
								if (fn.macd.slow (dataset).hist.getClose () > 0) {
									var wasBelow20pct = false;
									for (var i = 0; i < props.checkLastXStochasticBrackets; i++) {
										if (midStoch.data[i].low < .3) {
											wasBelow20pct = true;
											break;
										}
									}
									if (wasBelow20pct) {
										if (props.printBuySellStrategyHints) log (k + ' is a buy!!!!!!!!!!', 'red');
										didBuy[k] = true;
										bus.emit ('buy', k);
										continue;
									} else {
										if (props.printBuySellStrategyHints) log (k + ' is not a buy; mid stochastic seems overbought');
									}
								} else {
									if (props.printBuySellStrategyHints) log (k + ' is not a buy; slow MACD on decline');
								}
							} else {
								if (props.printBuySellStrategyHints) log (k + ' is not a buy; mid MACD on decline');
							}
						} else {
							if (props.printBuySellStrategyHints) log (k + ' is not a buy; fast MACD on decline');
						}
					} else {
						if (props.printBuySellStrategyHints) log (k + ' is not a buy; mid stochastic suggests it\'s strongly overbought');
					}
				} else {
					var sum = (
						(fn.macd.fast (dataset).hist.getClose () < 0 ? 2 : 0) +
						(fn.macd.mid  (dataset).hist.getClose () < 0 ? 2 : 0) +
						(fn.macd.slow (dataset).hist.getClose () < 0 ? 4 : 0) +
						(fn.stochastic.mid (dataset).d.getClose () > .75 ? 1 : 0)
					);
					if (sum > 4) {
						if (props.printBuySellStrategyHints) log ('sell ' + k + ' as fast as possible!!!', 'red');
						didBuy[k] = false;
						bus.emit ('sell', k);
					} else {
						if (props.printBuySellStrategyHints) log ('hodl ' + k);
					}
				}
			}
			if (props.printBuySellStrategyHints) log ('calculation took ' + (Date.now () - t1) + 'ms');
			// log ('value<BCH>: ' + data[data.length - 1]);
			// log ('ema<BCH>: ' + ema (data, 13));
			// log ('Stochastic<BCH>: ' + Math.round (stochastic.plain (data) * 100) + '%');
			// log ('Stochastic.smooth<BCH>: ' + Math.round (stochastic.smooth (data, 14, 4) * 100) + '%');
			// log ('macd<BCH>: ' + JSON.stringify (macd (data, 4, 16, 9)));
			// var inp : MAInput = new MAInput (13, data);
			//console.log (ti.macd);
		});
	});
});


const hints = {
	a: 'b'
};

export default hints;
