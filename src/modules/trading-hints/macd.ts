import logger from '../helper/logger';
import { Dataset, Data } from './dataset';
const log = logger (module);



declare interface MACDReturnType {
	macd: Dataset,
	signal: Dataset,
	hist: Dataset,
	toString: () => string
}

function macd (dataset: Dataset, fastLength: number, slowLength: number, smooth: number): MACDReturnType {
	var macdLine = Dataset.subtract (
		dataset.EMA (fastLength),
		dataset.EMA (slowLength)
	);
	var signalLine = macdLine.EMA (smooth);
	var histogramLine = Dataset.subtract (macdLine, signalLine);
	
	return {
		macd: macdLine,
		signal: signalLine,
		hist: histogramLine,
		toString () {
			return 'Line: ' + (Math.round (macdLine.getClose () * 100) / 100) + ', Signal: ' + (Math.round (signalLine.getClose () * 100) / 100) + ', MACD: ' + (Math.round (histogramLine.getClose () * 100) / 100);
		}
	};
}





// import ema from './ema';

// const SOURCE_TYPE = {
// 	open: 'open',
// 	high: 'high',
// 	low: 'low',
// 	close: 'close'
// }

// function macdLine (data: Array<number>, fastLength: number, slowLength: number) {
// 	var slowEMA = ema (data, slowLength);
// 	var fastEMA = ema (data, fastEMA);
// 	return fastEMA - slowEMA;
// }

// function macd (data: Array<number>, fastLength: number, slowLength: number, signalLength: number) {
// 	//var sourceNum : number = data[data.length - 1];
// 	var macdLines = [];
// 	var stepCount = signalLength * 7 | 0;
// 	if (stepCount + slowLength > data.length) {
// 		log ('chopped!', 'red');
// 		stepCount = data.length - slowLength;
// 	}
// 	for (var i = 0; i < stepCount; i++) {
// 		var slice = data.slice (0, data.length - stepCount + i + 1);
// 		macdLines.push (macdLine (slice, fastLength, slowLength));
// 	}
// 	var macdl = macdLines[macdLines.length - 1];
// 	var signal = ema (macdLines, signalLength);
// 	return {
// 		macd: macdl,
// 		signal: signal,
// 		hist: macdl - signal
// 	};
// }

export { macd, MACDReturnType };
export default macd;
