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
import fs = require ('fs');

// fs.writeFile (__dirname + '/../../log.txt', '', 'utf8', err => {
// 	if (err) console.log (err);
// });
// var append: Array<string> = [];
// function log (msg, color?:string) {
// 	if (color) {
// 		clog (msg, color);
// 	} else {
// 		clog (msg);
// 	}
// 	append.push (msg);
// }
// function checkAppend () {
// 	if (append.length === 0) {
// 		setTimeout (checkAppend, 500);
// 		return;
// 	}
// 	fs.appendFile (__dirname + '/../../log.txt', append.join ('\n') + '\n', 'utf8', err => {
// 		setTimeout (checkAppend, 500);
// 		if (err) console.log (err);
// 	});
// 	append = [];
// }
// setTimeout (checkAppend, 1000);

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


var didBuy: { [currency:string]: boolean } = {
	BCH: true,
	XETH: true,
	DASH: true,
	XREP: true,
	XXBT: true,
	XXMR: true,
	XXRP: true
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
			getAggregatedData (props.buyAndSellPeriodInMinutes * 60, 120, (err, result) => {
				if (err) throw err;
				if (props.printBuySellStrategyHints) log (result.BCH.data.length + ' sets fetched in ' + (Date.now () - t1) + 'ms');
				// if (props.printBuySellStrategyHints) log ('value<BCH>: ' + result.BCH.getClose ());
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
								if (props.requireMACDtoBePositive === false || midMACD.hist.getClose () > 0) {
									if (fn.macd.slow (dataset).hist.getClose () > 0) {
										var wasBelow20pct = false;
										for (var i = 0; i < props.checkLastXStochasticBrackets; i++) {
											if (midStoch.data[i].low < .3) {
												wasBelow20pct = true;
												break;
											}
										}
										if (wasBelow20pct) {
											if (props.printBuySellStrategyHints) log ('+|' + k + (k.length < 4 ? ' ' : '') + ' is a buy!!!!!!!!!!', 'red');
											didBuy[k] = true;
											bus.emit ('buy', k);
											continue;
										} else {
											if (props.printBuySellStrategyHints) log ('4|' + k + (k.length < 4 ? ' ' : '') + ' is not a buy; mid stochastic seems overbought');
										}
									} else {
										if (props.printBuySellStrategyHints) log ('3|' + k + (k.length < 4 ? ' ' : '') + ' is not a buy; slow MACD on decline');
									}
								} else {
									if (props.printBuySellStrategyHints) log ('2|' + k + (k.length < 4 ? ' ' : '') + ' is not a buy; mid MACD on decline');
								}
							} else {
								if (props.printBuySellStrategyHints) log ('1|' + k + (k.length < 4 ? ' ' : '') + ' is not a buy; fast MACD on decline');
							}
						} else {
							if (props.printBuySellStrategyHints) log ('0|' + k + (k.length < 4 ? ' ' : '') + ' is not a buy; mid stochastic suggests it\'s strongly overbought (' + Math.round (midStoch.getClose () * 100) + '%)');
						}
					} else {
						var sum = (
							(fn.macd.fast (dataset).hist.getClose () < 0 ? 2 : 0) +
							(fn.macd.mid  (dataset).hist.getClose () < 0 ? 2 : 0) +
							(fn.macd.slow (dataset).hist.getClose () < 0 ? 4 : 0) +
							(fn.stochastic.mid (dataset).d.getClose () > .75 ? 1 : 0)
						);
						if (sum > 4) {
							if (props.printBuySellStrategyHints) log ('-|' + k + (k.length < 4 ? ' ' : '') + ' sell as fast as possible!!!', 'red');
							didBuy[k] = false;
							bus.emit ('sell', k);
						} else {
							if (props.printBuySellStrategyHints) log ('*|' + k + (k.length < 4 ? ' ' : '') + ' hodl!');
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
		}, 500);
	});
});


const hints = {
	a: 'b'
};

export default hints;
